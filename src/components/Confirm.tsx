import { type ReactNode } from "react";
import styles from "./Confirm.module.css";

interface ConfirmProps {
	children: (args: {
		isOpen: boolean;
		setIsOpen: (isOpen: boolean) => void;
	}) => ReactNode;
	confirmText: string;
	onConfirm: () => void;
}

export default function Confirm({
	children,
	confirmText,
	onConfirm,
}: ConfirmProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onClose = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		if (isOpen) document.addEventListener("mousedown", onClose);
		return () => document.removeEventListener("mousedown", onClose);
	}, [isOpen]);

	return (
		<div className={styles.confirm} ref={containerRef}>
			{children({ isOpen, setIsOpen })}
			{isOpen && (
				<div className={styles.confirmMenu}>
					<div className={styles.confirmText}>{confirmText}</div>
					<div className={styles.confirmActions}>
						<button
							onClick={() => {
								onConfirm();
								setIsOpen(false);
							}}
						>
							{i18n.t("yes")}
						</button>
						<button onClick={() => setIsOpen(false)}>
							{i18n.t("no")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
