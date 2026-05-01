import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import colour from "@/utils/colour";
import styles from "./colour.module.css";

interface ColourProps {
	value?: string;
	onChange: (newValue: string) => void;
}

export default function Colour({ value = "#000000", onChange }: ColourProps) {
	const colourRef = useRef<colour>(new colour(value));
	const previewRef = useRef<HTMLDivElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const wbPlaneRef = useRef<HTMLDivElement | null>(null);
	const hSliderRef = useRef<HTMLDivElement | null>(null);
	const lastXRef = useRef(0);
	const [isEditing, setIsEditing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [text, setText] = useState(value);
	const [hwb, setHwb] = useState({ h: 0, w: 0, b: 0 });

	const handleWBMove = useCallback(
		(e: MouseEvent | React.MouseEvent) => {
			if (!wbPlaneRef.current) return;
			const rect = wbPlaneRef.current.getBoundingClientRect();
			const x = clamp(0, (e.clientX - rect.left) / rect.width, 1);
			const y = clamp(0, (e.clientY - rect.top) / rect.height, 1);
			lastXRef.current = x;
			const w = 100 * (1 - x) * (1 - y);
			const b = 100 * y;
			setHwb((prev) => ({ ...prev, w, b }));
			const hex = colourRef.current.hwb(hwb.h, w, b).toHex();
			setText(hex);
			onChange(hex);
		},
		[hwb.h, onChange],
	);

	const handleHMove = useCallback(
		(e: MouseEvent | React.MouseEvent) => {
			if (!hSliderRef.current) return;
			const rect = hSliderRef.current.getBoundingClientRect();
			const h = 360 * clamp(0, (e.clientX - rect.left) / rect.width, 1);
			setHwb((prev) => ({ ...prev, h }));
			const hex = colourRef.current.hwb(h, hwb.w, hwb.b).toHex();
			setText(hex);
			onChange(hex);
		},
		[hwb.w, hwb.b, onChange],
	);

	const attachListeners = useCallback(
		(moveHandler: (e: MouseEvent) => void) => {
			const handleUp = () => {
				window.removeEventListener("mousemove", moveHandler);
				window.removeEventListener("mouseup", handleUp);
			};
			window.addEventListener("mousemove", moveHandler);
			window.addEventListener("mouseup", handleUp);
		},
		[],
	);

	useEffect(() => {
		const parsed = colourRef.current?.parse(value).toHWB();
		setHwb(parsed);
		if (parsed.b !== 100)
			lastXRef.current = 1 - parsed.w / (100 - parsed.b);
		const onMouseDown = (event: MouseEvent) => {
			if (
				!popupRef.current?.contains(event.target as Node) &&
				!previewRef.current?.contains(event.target as Node)
			)
				setIsOpen(false);
		};
		if (isOpen) {
			document.addEventListener("mousedown", onMouseDown);
			return () => document.removeEventListener("mousedown", onMouseDown);
		}
	}, [isOpen]);

	return (
		<div className={styles.colour}>
			<input
				type="text"
				placeholder={i18n.t("anyCSSColour")}
				title={i18n.t("anyCSSColour")}
				value={isEditing ? text : value}
				onFocus={() => setIsEditing(true)}
				onChange={(e) => {
					const value = e.target.value;
					setText(value);
					onChange(colourRef.current.parse(value).toHex());
				}}
				onBlur={(e) => {
					const hex = colourRef.current.parse(e.target.value).toHex();
					setText(hex);
					onChange(hex);
					setIsEditing(false);
					e.target.scrollLeft = 0;
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
			<div
				ref={previewRef}
				className={styles.colourPreview}
				style={{ backgroundColor: value }}
				onClick={() => setIsOpen(!isOpen)}
			/>
			{isOpen && (
				<div className={clsx(styles.colourPopup)} ref={popupRef}>
					<div
						className={styles.wbPlane}
						ref={wbPlaneRef}
						onMouseDown={(e) => {
							handleWBMove(e);
							attachListeners(handleWBMove);
						}}
						style={{ backgroundColor: `hwb(${hwb.h} 0% 0%)` }}
					>
						<div
							className={styles.wbThumb}
							style={{
								backgroundColor: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)`,
								left:
									`clamp(var(--unit-8),` +
									`${hwb.b === 100 ? lastXRef.current * 100 : (1 - hwb.w / (100 - hwb.b)) * 100}%,` +
									`calc(100% - var(--unit-8)))`,
								top: `clamp(var(--unit-8), ${hwb.b}%, calc(100% - var(--unit-8)))`,
							}}
						/>
					</div>
					<div
						className={styles.hSlider}
						ref={hSliderRef}
						onMouseDown={(e) => {
							handleHMove(e);
							attachListeners(handleHMove);
						}}
					>
						<div
							className={styles.hThumb}
							style={{
								backgroundColor: `hwb(${hwb.h} 0% 0%)`,
								left: `clamp(var(--unit-8), ${(hwb.h / 360) * 100}%, calc(100% - var(--unit-8)))`,
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
