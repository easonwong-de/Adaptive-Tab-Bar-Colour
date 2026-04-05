import clsx from "clsx";
import styles from "./switch.module.css";

interface SwitchProps {
	label?: string;
	active?: boolean;
	onChange: (nextValue: boolean) => void;
}

export default function Switch({
	label = "",
	active = false,
	onChange,
}: SwitchProps) {
	return (
		<label className={styles.switch}>
			<button
				className={clsx(active && styles.selected)}
				onClick={() => onChange(!active)}
			></button>
			<p>{label}</p>
		</label>
	);
}
