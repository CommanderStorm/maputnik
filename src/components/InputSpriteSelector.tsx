import classnames from "classnames";
import React from "react";
import Autocomplete from "react-autocomplete";
import type { SpriteData } from "../libs/metadata";

const MAX_HEIGHT = 240;

export type InputSpriteSelectorProps = {
	value?: string;
	sprites: SpriteData[];
	onChange(value: string | undefined): unknown;
	"aria-label"?: string;
	disabled?: boolean;
};

export default class InputSpriteSelector extends React.Component<InputSpriteSelectorProps> {
	state = {
		maxHeight: MAX_HEIGHT,
	};

	autocompleteMenuEl: HTMLDivElement | null = null;

	static defaultProps = {
		onChange: () => {},
		sprites: [],
		disabled: false,
	};

	calcMaxHeight() {
		if (this.autocompleteMenuEl) {
			const maxHeight =
				window.innerHeight -
				this.autocompleteMenuEl.getBoundingClientRect().top;
			const limitedMaxHeight = Math.min(maxHeight, MAX_HEIGHT);

			if (limitedMaxHeight !== this.state.maxHeight) {
				this.setState({
					maxHeight: limitedMaxHeight,
				});
			}
		}
	}

	componentDidMount() {
		this.calcMaxHeight();
	}

	componentDidUpdate() {
		this.calcMaxHeight();
	}

	onChange(value: string) {
		this.props.onChange(value === "" ? undefined : value);
	}

	renderSpriteItem = (sprite: SpriteData, isHighlighted: boolean) => {
		return (
			<div
				key={sprite.id}
				className={classnames({
					"maputnik-sprite-selector-item": true,
					"maputnik-sprite-selector-item-highlighted": isHighlighted,
				})}
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
		const { sprites, value, disabled } = this.props;

		return (
			<div
				className="maputnik-sprite-selector"
				ref={(el) => {
					this.autocompleteMenuEl = el;
				}}
			>
				<Autocomplete
					menuStyle={{
						position: "fixed",
						overflow: "auto",
						maxHeight: this.state.maxHeight,
						zIndex: "998",
						background: "#2c3e50",
						border: "1px solid #555",
						borderTop: "none",
						boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
					}}
					wrapperProps={{
						className: "maputnik-sprite-selector-wrapper",
						style: { width: "100%" },
					}}
					inputProps={{
						"aria-label": this.props["aria-label"],
						className: "maputnik-string",
						spellCheck: false,
						placeholder: "Select or type sprite name...",
						disabled: disabled,
						autoComplete: "off",
					}}
					value={value || ""}
					items={sprites}
					getItemValue={(sprite) => sprite.id}
					onSelect={(v) => this.onChange(v)}
					onChange={(_e, v) => this.onChange(v)}
					shouldItemRender={(sprite, value = "") => {
						if (typeof value === "string") {
							return sprite.id.toLowerCase().indexOf(value.toLowerCase()) > -1;
						}
						return false;
					}}
					renderItem={(sprite, isHighlighted) =>
						this.renderSpriteItem(sprite, isHighlighted)
					}
					renderMenu={(items, value, style) => (
						<div style={style} className="maputnik-sprite-selector-dropdown">
							{items.length > 0 ? (
								items
							) : value ? (
								<div className="maputnik-sprite-selector-no-results">
									No sprites found matching "{value}"
								</div>
							) : null}
						</div>
					)}
				/>
			</div>
		);
	}
}
