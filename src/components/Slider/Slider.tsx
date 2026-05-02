import clsx from "clsx";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { clamp } from "@/utils/utility";
import Icon from "@/components/Icon/Icon";
import styles from "./slider.module.css";

interface SliderProps {
	disabled?: boolean;
	inPopup?: boolean;
	title?: string;
	warning?: string;
	minValue?: number;
	maxValue?: number;
	minorStep?: number;
	majorStep?: number;
	value?: number;
	leftIconType?: IconType;
	rightIconType?: IconType;
	onChange?: (newValue: number) => void;
	onCommit?: (oldValue: number, newValue: number) => void;
	onDisplay?: (value: number) => string;
}

interface SliderTrackProps {
	minValue: number;
	maxValue: number;
	minorStep: number;
	value: number;
	onChange: (newValue: number) => void;
	onCommit: (oldValue: number, newValue: number) => void;
	onDisplay: (value: number) => string;
}

export default function Slider({
	disabled = false,
	inPopup = false,
	title = "",
	warning = "",
	minValue = -50,
	maxValue = 50,
	minorStep = 1,
	majorStep = 5,
	value = minValue,
	leftIconType = "moon",
	rightIconType = "sun",
	onChange = () => {},
	onCommit = () => {},
	onDisplay = (value) => `${value}%`,
}: SliderProps) {
	return (
		<div className={clsx(styles.slider, disabled && "disabled")}>
			<div className={styles.body}>
				<button
					className={clsx(inPopup && styles.popupButton)}
					onPointerDown={() => {
						const newValue = clamp(
							minValue,
							(Math.ceil(value / majorStep) - 1) * majorStep,
							maxValue,
						);
						if (value !== newValue) {
							onChange(newValue);
							onCommit(value, newValue);
						}
					}}
				>
					<Icon type={leftIconType} />
				</button>
				{inPopup ? (
					<div className={styles.popupDisplay}>
						{onDisplay(value)}
					</div>
				) : (
					<SliderTrack
						minValue={minValue}
						maxValue={maxValue}
						minorStep={minorStep}
						value={value}
						onChange={onChange}
						onCommit={onCommit}
						onDisplay={onDisplay}
					/>
				)}
				<button
					className={clsx(inPopup && styles.popupButton)}
					onPointerDown={() => {
						const newValue = clamp(
							minValue,
							(Math.floor(value / majorStep) + 1) * majorStep,
							maxValue,
						);
						if (value !== newValue) {
							onChange(newValue);
							onCommit(value, newValue);
						}
					}}
				>
					<Icon type={rightIconType} />
				</button>
			</div>
			{!inPopup && (
				<h4>
					{title}
					{warning && (
						<span className={styles.warning} title={warning}>
							<Icon type="warning" />
						</span>
					)}
				</h4>
			)}
		</div>
	);
}

function SliderTrack({
	minValue,
	maxValue,
	minorStep,
	value,
	onChange,
	onCommit,
	onDisplay,
}: SliderTrackProps) {
	const rafRef = useRef<number | null>(null);
	const rectRef = useRef<DOMRect | null>(null);
	const trackRef = useRef<HTMLDivElement | null>(null);
	const dragOffsetRef = useRef({ offset: 0, thumbWidth: 0 });
	const dragStartValueRef = useRef(value);
	const [isDragging, setIsDragging] = useState(false);
	const [transientValue, setTransientValue] = useState(value);

	useEffect(
		() => () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		},
		[],
	);

	const currentValue = isDragging ? transientValue : value;

	const onDrag = (clientX: number): void => {
		const rect =
			rectRef.current ?? trackRef.current?.getBoundingClientRect();
		if (!rect) return;

		const { offset, thumbWidth } = dragOffsetRef.current;
		const targetLeft = clientX - offset - rect.left;
		const availableWidth = rect.width - thumbWidth;
		const percent = clamp(0, targetLeft / availableWidth, 1);

		const newValue = clamp(
			minValue,
			Math.round(
				(percent * (maxValue - minValue) + minValue) / minorStep,
			) * minorStep,
			maxValue,
		);
		if (newValue !== currentValue) {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				setTransientValue(newValue);
				onChange(newValue);
			});
		}
	};

	const onDragStop = (): void => {
		rectRef.current = null;
		const oldValue = dragStartValueRef.current;
		const newValue = transientValue;
		setIsDragging(false);
		if (oldValue !== newValue) {
			onChange(newValue);
			onCommit(oldValue, newValue);
		}
	};

	return (
		<div
			ref={trackRef}
			className={clsx(styles.track, isDragging && styles.dragging)}
			style={
				{
					"--percent": (value - minValue) / (maxValue - minValue),
				} as CSSProperties
			}
		>
			<div className={styles.fill} />
			<div
				className={styles.thumb}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					rectRef.current =
						trackRef.current?.getBoundingClientRect() ?? null;
					const thumbRect = e.currentTarget.getBoundingClientRect();
					dragOffsetRef.current = {
						offset: e.clientX - thumbRect.left,
						thumbWidth: thumbRect.width,
					};
					dragStartValueRef.current = value;
					setTransientValue(value);
					setIsDragging(true);
					onDrag(e.clientX);
				}}
				onPointerMove={(e) => {
					if (isDragging) onDrag(e.clientX);
				}}
				onPointerUp={onDragStop}
				onPointerCancel={onDragStop}
			/>
			<div className={styles.display}>{onDisplay(currentValue)}</div>
		</div>
	);
}
