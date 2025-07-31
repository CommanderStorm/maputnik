import npmurl from 'url'

export type SpriteMetadata = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelRatio?: number;
  sdf?: boolean;
}

export type SpriteData = {
  id: string;
  imageData?: string; // base64 encoded image data
  width?: number;
  height?: number;
  sdf?: boolean;
}

function loadJSON(url: string, defaultValue: any, cb: (...args: any[]) => void) {
  fetch(url, {
    mode: 'cors',
    credentials: "same-origin"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load metadata for ' + url);
      }
      return response.json();
    })
    .then((body) => {
      cb(body)
    })
    .catch(() => {
      console.warn('Can not load metadata for ' + url + ', using default value ' + defaultValue);
      cb(defaultValue)
    })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function extractSpriteImages(spriteSheet: HTMLImageElement, metadata: Record<string, SpriteMetadata>): SpriteData[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const sprites: SpriteData[] = [];

  for (const [id, meta] of Object.entries(metadata)) {
    const { x, y, width, height, sdf } = meta;

    // Set canvas size to sprite dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw sprite from sheet
    ctx.drawImage(
      spriteSheet,
      x, y, width, height,  // source
      0, 0, width, height   // destination
    );

    // Convert to base64
    const imageData = canvas.toDataURL('image/png');

    sprites.push({
      id,
      imageData,
      width,
      height,
      sdf: sdf || false
    });
  }

  return sprites;
}

export function downloadGlyphsMetadata(urlTemplate: string, cb: (...args: any[]) => void) {
  if(!urlTemplate) return cb([])

  // Special handling because Tileserver GL serves the fontstacks metadata differently
  // https://github.com/klokantech/tileserver-gl/pull/104#issuecomment-274444087
  const urlObj = npmurl.parse(urlTemplate);
  const normPathPart = '/%7Bfontstack%7D/%7Brange%7D.pbf';
  if(urlObj.pathname === normPathPart) {
    urlObj.pathname = '/fontstacks.json';
  } else {
    urlObj.pathname = urlObj.pathname!.replace(normPathPart, '.json');
  }
  const url = npmurl.format(urlObj);

  loadJSON(url, [], cb)
}

export function downloadSpriteMetadata(baseUrl: string, cb: (...args: any[]) => void) {
  if(!baseUrl) return cb([])
  const url = baseUrl + '.json'
  loadJSON(url, {}, glyphs => cb(Object.keys(glyphs)))
}

export function downloadSpriteData(baseUrl: string, cb: (sprites: SpriteData[]) => void) {
  if (!baseUrl) return cb([]);

  const metadataUrl = baseUrl + '.json';
  const imageUrl = baseUrl + '.png';

  // Load both metadata and image
  Promise.all([
    new Promise<Record<string, SpriteMetadata>>((resolve, reject) => {
      loadJSON(metadataUrl, {}, (metadata) => {
        if (Object.keys(metadata).length === 0) {
          reject(new Error('No sprite metadata found'));
        } else {
          resolve(metadata);
        }
      });
    }),
    loadImage(imageUrl)
  ])
  .then(([metadata, spriteSheet]) => {
    const sprites = extractSpriteImages(spriteSheet, metadata);
    cb(sprites);
  })
    .catch((error) => {
        console.warn('Failed to load sprite data from ' + baseUrl + ':', error);
        // Fallback to just sprite names if image loading fails
        loadJSON(metadataUrl, {}, (metadata) => {
            const fallbackSprites = Object.keys(metadata).map(id => ({
                id,
                sdf: metadata[id]?.sdf || false
            }));
            cb(fallbackSprites);
        });
    });
}
