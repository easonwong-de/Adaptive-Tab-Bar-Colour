import { useEffect, useState, useRef } from "react";
import styles from "./confirm.module.css";

export default function Confirm({ children, confirmText, onConfirm }) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		const onClose = (event) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target)
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
