import clsx from "clsx";
import styles from "./toggle.module.css";

interface ToggleProps {
	isTabToggle?: boolean;
	itemList: string[];
	activeIndex?: number;
	onChange: (newIndex: number) => void;
}

export default function Toggle({
	isTabToggle = false,
	itemList,
	activeIndex = 0,
	onChange,
}: ToggleProps) {
	return (
		<div className={clsx(styles.toggle, isTabToggle && styles.tabToggle)}>
			{itemList.map((item, index) => {
				return (
					<button
						key={`toggle${item}${index}`}
						className={clsx(
							activeIndex === index && styles.selected,
						)}
						onPointerDown={() => onChange(index)}
					>
						{item}
					</button>
				);
			})}
		</div>
	);
}
