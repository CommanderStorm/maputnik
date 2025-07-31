import classnames from "classnames";
import React from "react";

export type InputSpriteSelectorProps = {
  value?: string;
  sprites: SpriteData[];
  onChange(value: string | undefined): unknown;
  "aria-label"?: string;
  disabled?: boolean;
};

export type SpriteData = {
  id: string;
  imageData?: string; // base64 encoded image data
  width?: number;
  height?: number;
  sdf?: boolean;
};

type InputSpriteSelectorState = {
  isOpen: boolean;
  searchTerm: string;
  highlightedIndex: number;
};

export default class InputSpriteSelector extends React.Component<
  InputSpriteSelectorProps,
  InputSpriteSelectorState
> {
  private inputRef = React.createRef<HTMLInputElement>();
  private dropdownRef = React.createRef<HTMLDivElement>();
  private itemRefs: (HTMLDivElement | null)[] = [];

  static defaultProps = {
    onChange: () => {},
    sprites: [],
    disabled: false,
  };

  constructor(props: InputSpriteSelectorProps) {
    super(props);
    this.state = {
      isOpen: false,
      searchTerm: props.value || "",
      highlightedIndex: -1,
    };
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    if (
      this.dropdownRef.current &&
      !this.dropdownRef.current.contains(event.target as Node) &&
      this.inputRef.current &&
      !this.inputRef.current.contains(event.target as Node)
    ) {
      this.setState({ isOpen: false });
    }
  };

  filteredSprites = () => {
    const { sprites } = this.props;
    const { searchTerm } = this.state;

    if (!searchTerm) return sprites;

    return sprites.filter((sprite) =>
      sprite.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({
      searchTerm: value,
      isOpen: true,
      highlightedIndex: -1,
    });
    this.props.onChange(value === "" ? undefined : value);
  };

  handleInputFocus = () => {
    if (!this.props.disabled) {
      this.setState({ isOpen: true });
    }
  };

  handleInputKeyDown = (e: React.KeyboardEvent) => {
    const { isOpen, highlightedIndex } = this.state;
    const filteredSprites = this.filteredSprites();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          this.setState({ isOpen: true });
        } else {
          const nextIndex =
            highlightedIndex < filteredSprites.length - 1
              ? highlightedIndex + 1
              : 0;
          this.setState({ highlightedIndex: nextIndex });
          this.scrollToItem(nextIndex);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          const prevIndex =
            highlightedIndex > 0
              ? highlightedIndex - 1
              : filteredSprites.length - 1;
          this.setState({ highlightedIndex: prevIndex });
          this.scrollToItem(prevIndex);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (
          isOpen &&
          highlightedIndex >= 0 &&
          filteredSprites[highlightedIndex]
        ) {
          this.selectSprite(filteredSprites[highlightedIndex]);
        }
        break;
      case "Escape":
        this.setState({ isOpen: false, highlightedIndex: -1 });
        break;
    }
  };

  scrollToItem = (index: number) => {
    const item = this.itemRefs[index];
    if (item && this.dropdownRef.current) {
      const dropdown = this.dropdownRef.current;
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const dropdownTop = dropdown.scrollTop;
      const dropdownBottom = dropdownTop + dropdown.offsetHeight;

      if (itemTop < dropdownTop) {
        dropdown.scrollTop = itemTop;
      } else if (itemBottom > dropdownBottom) {
        dropdown.scrollTop = itemBottom - dropdown.offsetHeight;
      }
    }
  };

  selectSprite = (sprite: SpriteData) => {
    this.setState({
      searchTerm: sprite.id,
      isOpen: false,
      highlightedIndex: -1,
    });
    this.props.onChange(sprite.id);
  };

  renderSpriteItem = (sprite: SpriteData, index: number) => {
    const { highlightedIndex } = this.state;
    const isHighlighted = index === highlightedIndex;

    return (
      <div
        key={sprite.id}
        ref={(el) => (this.itemRefs[index] = el)}
        className={classnames({
          "maputnik-sprite-selector-item": true,
          "maputnik-sprite-selector-item-highlighted": isHighlighted,
        })}
        onClick={() => this.selectSprite(sprite)}
        onMouseEnter={() => this.setState({ highlightedIndex: index })}
      >
        <div className="maputnik-sprite-selector-item-image">
          {sprite.imageData ? (
            <img
              src={sprite.imageData}
              alt={sprite.id}
              className={classnames({
                "maputnik-sprite-selector-image": true,
                "maputnik-sprite-selector-image-sdf": sprite.sdf,
              })}
            />
          ) : (
            <div className="maputnik-sprite-selector-placeholder">
              {sprite.id.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="maputnik-sprite-selector-item-text">
          <span className="maputnik-sprite-selector-item-name">
            {sprite.id}
          </span>
          {sprite.sdf && (
            <span className="maputnik-sprite-selector-item-badge">SDF</span>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { "aria-label": ariaLabel, disabled } = this.props;
    const { isOpen, searchTerm } = this.state;
    const filteredSprites = this.filteredSprites();

    return (
      <div className="maputnik-sprite-selector">
        <input
          ref={this.inputRef}
          type="text"
          className="maputnik-string"
          value={searchTerm}
          onChange={this.handleInputChange}
          onFocus={this.handleInputFocus}
          onKeyDown={this.handleInputKeyDown}
          aria-label={ariaLabel}
          placeholder="Select or type sprite name..."
          disabled={disabled}
          autoComplete="off"
        />

        {isOpen && filteredSprites.length > 0 && (
          <div
            ref={this.dropdownRef}
            className="maputnik-sprite-selector-dropdown"
          >
            {filteredSprites.map((sprite, index) =>
              this.renderSpriteItem(sprite, index),
            )}
          </div>
        )}

        {isOpen && filteredSprites.length === 0 && searchTerm && (
          <div className="maputnik-sprite-selector-dropdown">
            <div className="maputnik-sprite-selector-no-results">
              No sprites found matching "{searchTerm}"
            </div>
          </div>
        )}
      </div>
    );
  }
}
