import clsx from "clsx";
import styles from "./switch.module.css";

export default function Switch({ label = "", active = false, onChange }) {
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
