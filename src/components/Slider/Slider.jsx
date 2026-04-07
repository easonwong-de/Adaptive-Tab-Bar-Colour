import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { clamp } from "@/utils/utility.js";
import Icon from "../Icon/Icon.jsx";
import styles from "./slider.module.css";

export default function Slider({
	className = "",
	title = "",
	warning = "",
	minValue = -50,
	maxValue = 50,
	minorStep = 1,
	majorStep = 5,
	value = minValue,
	leftIconType = "moon",
	rightIconType = "sun",
	onChange,
	onDisplay = (value) => `${value} %`,
}) {
	const rafRef = useRef(null);
	const rectRef = useRef(null);
	const trackRef = useRef(null);
	const dragOffsetRef = useRef(0);
	const [isDragging, setIsDragging] = useState(false);
	const [transientValue, setTransientValue] = useState(value);
	const currentValue = isDragging ? transientValue : value;

	useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

	const onDown = () => {
		const newValue = clamp(
			minValue,
			(Math.ceil(value / majorStep) - 1) * majorStep,
			maxValue,
		);
		if (newValue !== value) onChange(newValue);
	};

	const onDrag = (clientX) => {
		const rect =
			rectRef.current || trackRef.current?.getBoundingClientRect();
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
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				setTransientValue(newValue);
				onChange(newValue);
			});
		}
	};

	const onDragStop = () => {
		rectRef.current = null;
		setIsDragging(false);
	};

	const onUp = () => {
		const newValue = clamp(
			minValue,
			(Math.floor(value / majorStep) + 1) * majorStep,
			maxValue,
		);
		if (newValue !== value) onChange(newValue);
	};

	return (
		<div className={clsx(styles.slider, className)}>
			<div className={styles.body}>
				<button onPointerDown={onDown}>
					<Icon type={leftIconType} />
				</button>
				<div
					ref={trackRef}
					className={clsx(
						styles.track,
						isDragging && styles.dragging,
					)}
					style={{
						"--percent": (value - minValue) / (maxValue - minValue),
					}}
				>
					<div className={styles.fill} />
					<div
						className={styles.thumb}
						onPointerDown={(e) => {
							e.currentTarget.setPointerCapture(e.pointerId);
							rectRef.current =
								trackRef.current.getBoundingClientRect();
							const thumbRect =
								e.currentTarget.getBoundingClientRect();
							dragOffsetRef.current = {
								offset: e.clientX - thumbRect.left,
								thumbWidth: thumbRect.width,
							};
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
					<div className={styles.display}>
						{onDisplay(currentValue)}
					</div>
				</div>
				<button onPointerDown={onUp}>
					<Icon type={rightIconType} />
				</button>
			</div>
			<h4>
				{title}
				{warning && (
					<span className={styles.warning} title={warning}>
						<Icon type="warning" />
					</span>
				)}
			</h4>
		</div>
	);
}
