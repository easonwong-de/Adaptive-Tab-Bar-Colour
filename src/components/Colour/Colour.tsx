import { useState } from "react";
import colour from "@/utils/colour";
import styles from "./colour.module.css";

interface ColourProps {
	value?: string;
	onChange: (newValue: string) => void;
}

export default function Colour({ value = "#000000", onChange }: ColourProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [transientValue, setTransientValue] = useState(value);

	return (
		<div className={styles.colour}>
			<input
				type="text"
				placeholder={i18n.t("anyCSSColour")}
				title={i18n.t("anyCSSColour")}
				value={isEditing ? transientValue : value}
				onFocus={() => setIsEditing(true)}
				onChange={(e) => {
					setTransientValue(e.target.value);
					onChange(new colour(e.target.value).toHex());
				}}
				onBlur={(e) => {
					e.target.scrollLeft = 0;
					const newColour = new colour(e.target.value).toHex();
					setTransientValue(newColour);
					onChange(newColour);
					setIsEditing(false);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
			<label style={{ backgroundColor: value }}>
				<input
					type="color"
					value={value}
					onChange={(e) => {
						const newColour = new colour(e.target.value).toHex();
						setTransientValue(newColour);
						onChange(newColour);
					}}
				/>
			</label>
		</div>
	);
}
