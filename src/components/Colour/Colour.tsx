import clsx from "clsx";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import colour from "@/utils/colour";
import styles from "./colour.module.css";

interface ColourProps {
	value?: string;
	onChange: (newValue: string) => void;
}

export default function Colour({ value = "#000000", onChange }: ColourProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const textRef = useRef<HTMLInputElement | null>(null);
	const previewRef = useRef<HTMLDivElement | null>(null);
	const colourRef = useRef<colour>(new colour(value));
	const [isEditing, setIsEditing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [text, setText] = useState(value);

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			if (
				!containerRef.current?.contains(event.target as Node) ||
				textRef.current?.contains(event.target as Node)
			)
				setIsOpen(false);
		};
		if (isOpen) {
			document.addEventListener("pointerdown", onPointerDown);
			return () =>
				document.removeEventListener("pointerdown", onPointerDown);
		}
		colourRef.current.parse(value);
	}, [isOpen]);

	useEffect(() => {
		const onBlur = () => setIsOpen(false);
		document.addEventListener("blur", onBlur);
		return () => document.removeEventListener("blur", onBlur);
	}, []);

	return (
		<div className={styles.colour} ref={containerRef}>
			<input
				type="text"
				ref={textRef}
				placeholder={i18n.t("anyCSSColour")}
				title={i18n.t("anyCSSColour")}
				value={isEditing ? text : value}
				onFocus={() => setIsEditing(true)}
				onChange={(e) => {
					const val = e.target.value;
					setText(val);
					onChange(colourRef.current.parse(val).toHex());
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
				className={styles.preview}
				ref={previewRef}
				style={{ backgroundColor: value }}
				onClick={() => setIsOpen(!isOpen)}
			/>
			{isOpen && (
				<ColourPopup
					value={colourRef.current}
					onChange={(hex) => {
						setText(hex);
						onChange(hex);
					}}
				/>
			)}
		</div>
	);
}

interface ColourPopupProps {
	value: colour;
	onChange: (hex: string) => void;
}

function ColourPopup({ value, onChange }: ColourPopupProps) {
	const colourRef = useRef<colour>(new colour(value));
	const wbPlaneRef = useRef<HTMLDivElement | null>(null);
	const hSliderRef = useRef<HTMLDivElement | null>(null);
	const lastXRef = useRef(0);
	const [hwb, setHwb] = useState(colourRef.current.toHWB());

	const onMoveStop = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId))
			e.currentTarget.releasePointerCapture(e.pointerId);
	}, []);

	const onWBMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (e.buttons === 0) return onMoveStop(e);
			if (!wbPlaneRef.current) return;

			const rect = wbPlaneRef.current.getBoundingClientRect();
			const x = clamp(0, (e.clientX - rect.left) / rect.width, 1);
			const y = clamp(0, (e.clientY - rect.top) / rect.height, 1);
			lastXRef.current = x;
			const w = 100 * (1 - x) * (1 - y);
			const b = 100 * y;
			setHwb((prev) => ({ ...prev, w, b }));
			onChange(colourRef.current.hwb(hwb.h, w, b).toHex());
		},
		[hwb.h, onChange],
	);

	const onHMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (e.buttons === 0) return onMoveStop(e);
			if (!hSliderRef.current) return;

			const rect = hSliderRef.current.getBoundingClientRect();
			const h = 360 * clamp(0, (e.clientX - rect.left) / rect.width, 1);
			setHwb((prev) => ({ ...prev, h }));
			onChange(colourRef.current.hwb(h, hwb.w, hwb.b).toHex());
		},
		[hwb.w, hwb.b, onChange],
	);

	useEffect(() => {
		const newHWB = colourRef.current?.parse(value).toHWB();
		setHwb(newHWB);
		if (newHWB.b !== 100)
			lastXRef.current = 1 - newHWB.w / (100 - newHWB.b);
	}, [value]);

	return (
		<div className={clsx(styles.popup)}>
			<div
				className={styles.wbPlane}
				ref={wbPlaneRef}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					onWBMove(e);
				}}
				onPointerMove={onWBMove}
				onPointerUp={onMoveStop}
				onPointerCancel={onMoveStop}
				style={{ "--hue": `hwb(${hwb.h} 0% 0%)` } as CSSProperties}
			>
				<div
					className={styles.wbThumb}
					style={{
						backgroundColor: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)`,
						left: `clamp(var(--unit-8),
							${hwb.b === 100 ? lastXRef.current * 100 : (1 - hwb.w / (100 - hwb.b)) * 100}%,
							calc(100% - var(--unit-8)))`,
						top: `clamp(var(--unit-8),
							${hwb.b}%,
							calc(100% - var(--unit-8)))`,
					}}
				/>
			</div>
			<div
				className={styles.hSlider}
				ref={hSliderRef}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					onHMove(e);
				}}
				onPointerMove={onHMove}
				onPointerUp={onMoveStop}
				onPointerCancel={onMoveStop}
			>
				<div
					className={styles.hThumb}
					style={{
						backgroundColor: `hwb(${hwb.h} 0% 0%)`,
						left: `clamp(var(--unit-8),
							${(hwb.h / 360) * 100}%,
							calc(100% - var(--unit-8)))`,
					}}
				/>
			</div>
		</div>
	);
}
