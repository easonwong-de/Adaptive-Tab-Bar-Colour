import clsx from "clsx";
import styles from "./input.module.css";

interface InputProps {
	value?: string;
	placeholder?: string;
	warning?: string;
	onChange: (newValue: string) => void;
}

export default function Input({
	value = "",
	placeholder = "",
	warning = "",
	onChange,
}: InputProps) {
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
