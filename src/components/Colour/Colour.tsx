import clsx from "clsx";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import colour from "@/utils/colour";
import styles from "./colour.module.css";

interface ColourProps {
	value?: string;
	inPopup?: boolean;
	onChange: (newValue: string) => void;
}

export default function Colour({
	value = "#000000",
	inPopup = false,
	onChange,
}: ColourProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const previewRef = useRef<HTMLDivElement | null>(null);
	const colourRef = useRef<colour>(new colour(value));
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(value);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			if (
				!containerRef.current?.contains(event.target as Node) ||
				inputRef.current?.contains(event.target as Node)
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
				ref={inputRef}
				placeholder={i18n.t("anyCSSColour")}
				title={i18n.t("anyCSSColour")}
				value={isEditing ? text : value}
				onFocus={(e) => {
					setIsEditing(true);
					setText(value);
					e.target.select();
				}}
				onBlur={(e) => {
					setIsEditing(false);
					e.target.scrollLeft = 0;
				}}
				onChange={(e) => {
					const value = e.target.value;
					const hex = colourRef.current.parse(value).toHex();
					setText(value);
					onChange(hex);
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
			{!inPopup && (
				<input
					type="color"
					value={value}
					onChange={(e) => {
						const value = e.target.value;
						const hex = colourRef.current.parse(value).toHex();
						setText(hex);
						onChange(hex);
					}}
				/>
			)}
			{isOpen && (
				<ColourPopup
					value={colourRef.current}
					inPopup={inPopup}
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
	inPopup: boolean;
	onChange: (hex: string) => void;
}

type ColourFormat = "HEX" | "RGB" | "HWB" | "CSS";

function ColourPopup({ value, inPopup, onChange }: ColourPopupProps) {
	const colourRef = useRef<colour>(new colour(value));
	const wbPlaneRef = useRef<HTMLDivElement | null>(null);
	const hSliderRef = useRef<HTMLDivElement | null>(null);
	const lastXRef = useRef(0);
	const [hwb, setHwb] = useState(colourRef.current.toHWB());
	const [format, setFormat] = useState<ColourFormat>("HEX");

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

	const onInputChange = (hex: string) => {
		setHwb(colourRef.current.parse(hex).toHWB());
		onChange(hex);
	};

	return (
		<div className={clsx(styles.popup, inPopup && styles.inPopup)}>
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
				style={
					{
						backgroundColor: `hwb(${hwb.h} 0% 0%)`,
						"--x": `${hwb.b === 100 ? lastXRef.current * 100 : (1 - hwb.w / (100 - hwb.b)) * 100}%`,
						"--y": `${hwb.b}%`,
					} as CSSProperties
				}
			>
				<div className={styles.wbIris} />
				<div
					className={styles.wbPupil}
					style={{
						backgroundColor: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)`,
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
				style={{ "--x": `${(hwb.h / 360) * 100}%` } as CSSProperties}
			>
				<div className={styles.hIris} />
				<div
					className={styles.hPupil}
					style={{ backgroundColor: `hwb(${hwb.h} 0% 0%)` }}
				/>
			</div>
			<div className={styles.toolbox}>
				<select
					value={format}
					onChange={(e) => setFormat(e.target.value as ColourFormat)}
				>
					<option value="HEX">HEX</option>
					<option value="RGB">RGB</option>
					<option value="HWB">HWB</option>
					<option value="CSS">CSS</option>
				</select>
				{format === "HEX" && (
					<HEXInput
						value={colourRef.current}
						onChange={onInputChange}
					/>
				)}
				{format === "RGB" && (
					<RGBInput
						value={colourRef.current}
						onChange={onInputChange}
					/>
				)}
				{format === "HWB" && (
					<HWBInput
						value={colourRef.current}
						onChange={onInputChange}
					/>
				)}
				{format === "CSS" && (
					<CSSInput
						value={colourRef.current}
						onChange={onInputChange}
					/>
				)}
			</div>
		</div>
	);
}

interface InputProps {
	value: colour;
	onChange: (hex: string) => void;
}

function HEXInput({ value, onChange }: InputProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState("");

	const hex = value.toHex().slice(1);

	return (
		<div className={styles.hex}>
			<input
				type="text"
				value={isEditing ? text : hex}
				onFocus={(e) => {
					setIsEditing(true);
					setText(hex);
					e.target.select();
				}}
				onBlur={() => setIsEditing(false)}
				onChange={(e) => {
					const value = e.target.value;
					if (value !== "" && !/^[0-9A-Fa-f]*$/.test(value)) return;
					setText(value);
					if (value.length === 3 || value.length === 6)
						onChange(new colour().parse(`#${value}`).toHex());
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
		</div>
	);
}

function RGBInput({ value, onChange }: InputProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState({ r: "", g: "", b: "" });

	const r = Math.round(value.r).toString();
	const g = Math.round(value.g).toString();
	const b = Math.round(value.b).toString();

	const getNum = (value: string, fallback: string) =>
		parseFloat(value || fallback || "0");

	const onNumberChange = (
		key: "r" | "g" | "b",
		value: string,
		onValid: (num: number) => void,
	) => {
		if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
		setText((prev) => ({ ...prev, [key]: value }));
		onValid(parseFloat(value || "0"));
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (!isEditing) {
			setIsEditing(true);
			setText({ r, g, b });
		}
		e.target.select();
	};

	return (
		<>
			<div>
				<input
					type="text"
					value={isEditing ? text.r : r}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("r", e.target.value, (nr) => {
							onChange(
								new colour()
									.rgb(
										nr,
										getNum(text.g, g),
										getNum(text.b, b),
									)
									.toHex(),
							);
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div>
				<input
					type="text"
					value={isEditing ? text.g : g}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("g", e.target.value, (ng) => {
							onChange(
								new colour()
									.rgb(
										getNum(text.r, r),
										ng,
										getNum(text.b, b),
									)
									.toHex(),
							);
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div>
				<input
					type="text"
					value={isEditing ? text.b : b}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("b", e.target.value, (nb) => {
							onChange(
								new colour()
									.rgb(
										getNum(text.r, r),
										getNum(text.g, g),
										nb,
									)
									.toHex(),
							);
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
		</>
	);
}

function HWBInput({ value, onChange }: InputProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState({ h: "", w: "", b: "" });

	const hwb = value.toHWB();
	const h = Math.round(hwb.h).toString();
	const w = Math.round(hwb.w).toString();
	const b = Math.round(hwb.b).toString();

	const getNum = (value: string, fallback: string) =>
		parseFloat(value || fallback || "0");

	const onNumberChange = (
		key: "h" | "w" | "b",
		value: string,
		onValid: (num: number) => void,
	) => {
		if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
		setText((prev) => ({ ...prev, [key]: value }));
		onValid(parseFloat(value || "0"));
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (!isEditing) {
			setIsEditing(true);
			setText({ h, w, b });
		}
		e.target.select();
	};

	return (
		<>
			<div>
				<input
					type="text"
					value={isEditing ? text.h : h}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("h", e.target.value, (nh) => {
							onChange(
								new colour()
									.hwb(
										nh,
										getNum(text.w, w),
										getNum(text.b, b),
									)
									.toHex(),
							);
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div className={styles.percent}>
				<input
					type="text"
					value={isEditing ? text.w : w}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("w", e.target.value, (nw) => {
							onChange(
								new colour()
									.hwb(
										getNum(text.h, h),
										nw,
										getNum(text.b, b),
									)
									.toHex(),
							);
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div className={styles.percent}>
				<input
					type="text"
					value={isEditing ? text.b : b}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("b", e.target.value, (nb) => {
							onChange(
								new colour()
									.hwb(
										getNum(text.h, h),
										getNum(text.w, w),
										nb,
									)
									.toHex(),
							);
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
		</>
	);
}

function CSSInput({ value, onChange }: InputProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState("");

	const css = value.toHex();

	return (
		<div className={styles.css}>
			<input
				type="text"
				value={isEditing ? text : css}
				onFocus={(e) => {
					setIsEditing(true);
					setText(css);
					e.target.select();
				}}
				onBlur={(e) => {
					setIsEditing(false);
					e.target.scrollLeft = 0;
				}}
				onChange={(e) => {
					const value = e.target.value;
					const hex = new colour().parse(value).toHex();
					setText(value);
					onChange(hex);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
		</div>
	);
}
