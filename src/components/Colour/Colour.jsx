import { useState } from "react";
import colour from "@/utils/colour.js";
import styles from "./colour.module.css";

export default function Colour({ value = "#000000", onChange }) {
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
					if (e.key === "Enter") e.target.blur();
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
