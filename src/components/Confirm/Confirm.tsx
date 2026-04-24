import clsx from "clsx";
import { type ReactNode, useEffect, useRef, useState } from "react";
import styles from "./confirm.module.css";

interface ConfirmProps {
	children: (open: () => void) => ReactNode;
	confirmText: string;
	position?: "up" | "down";
	onConfirm: () => void;
}

export default function Confirm({
	children,
	position = "down",
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
			{children(() => setIsOpen(!isOpen))}
			{isOpen && (
				<div
					className={clsx(
						styles.confirmMenu,
						position === "up" && styles.up,
					)}
				>
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
