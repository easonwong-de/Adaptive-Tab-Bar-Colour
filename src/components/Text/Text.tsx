import clsx from "clsx";
import Icon from "@/components/Icon/Icon";
import styles from "./text.module.css";

interface TextProps {
	value?: string;
	placeholder?: string;
	warning?: string;
	onChange: (newValue: string) => void;
}

export default function Text({
	value = "",
	placeholder = "",
	warning = "",
	onChange,
}: TextProps) {
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
					if (e.key === "Enter") e.currentTarget.blur();
				}}
				onBlur={(e) => (e.target.scrollLeft = 0)}
			/>
			<div title={warning}>
				<Icon type="warning" />
			</div>
		</div>
	);
}
