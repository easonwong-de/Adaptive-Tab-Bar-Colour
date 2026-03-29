import clsx from "clsx";
import Icon from "../Icon/Icon";
import styles from "./text.module.css";

export default function Text({
	value = "",
	placeholder = "",
	warning = "",
	onChange = () => {},
}) {
	return (
		<div
			className={clsx(
				styles.text,
				value === "" && warning !== "" && styles.warning,
			)}
		>
			<input
				type="text"
				placeholder={placeholder}
				title={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.target.blur();
				}}
				onBlur={(e) => (e.target.scrollLeft = 0)}
			/>
			<div title={warning}>
				<Icon type="warning" />
			</div>
		</div>
	);
}
