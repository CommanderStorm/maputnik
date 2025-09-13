import React from "react";
import type { SpriteData } from "../libs/metadata";
import InputAutocomplete from "./InputAutocomplete";
import InputSpriteSelector from "./InputSpriteSelector";

export type FieldSpriteProps = {
	value?: string;
	onChange(value: string | undefined): unknown;
	"aria-label"?: string;
	disabled?: boolean;
	sprites?: SpriteData[];
	fallbackOptions?: string[];
};

export default class FieldSprite extends React.Component<FieldSpriteProps> {
	static defaultProps = {
		onChange: () => {},
		sprites: [],
		fallbackOptions: [],
		disabled: false,
	};

	render() {
		const { sprites, fallbackOptions, value, onChange, disabled } = this.props;

		// Check if value is an expression - if so, use regular autocomplete input
		const isExpression = Array.isArray(value);

		// Use sprite selector if we have sprite data and the value is not an expression
		if (sprites && sprites.length > 0 && !isExpression) {
			return (
				<InputSpriteSelector
					value={value}
					sprites={sprites}
					onChange={onChange}
					aria-label={this.props["aria-label"]}
					disabled={disabled}
				/>
			);
		}

		// Fallback to autocomplete with sprite names or other options
		const options = fallbackOptions || [];
		return (
			<InputAutocomplete
				value={value}
				options={options.map((option) => [option, option])}
				onChange={onChange}
				aria-label={this.props["aria-label"]}
				keepMenuWithinWindowBounds={true}
			/>
		);
	}
}
