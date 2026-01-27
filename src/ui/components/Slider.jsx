import { useEffect, useRef, useState } from "react";
import { clamp } from "../../utility.js";

export default function Slider({
	className = "",
	title = "",
	minValue = -50,
	maxValue = 50,
	minorStep = 1,
	majorStep = 5,
	initialValue = minValue,
	onChange = () => {},
	onDisplay = (value) => `${value} %`,
}) {
	const rafRef = useRef(null);
	const rectRef = useRef(null);
	const trackRef = useRef(null);
	const [value, setValue] = useState(initialValue);
	const [isDragging, setIsDragging] = useState(false);
	useEffect(() => setValue(initialValue), [initialValue]);
	useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

	const onDown = () => {
		const newValue = clamp(
			minValue,
			(Math.ceil(value / minorStep) - 1) * minorStep,
			maxValue,
		);
		if (newValue !== value) {
			setValue(newValue);
			onChange(newValue);
		}
	};

	const onDrag = (clientX) => {
		const rect =
			rectRef.current || trackRef.current?.getBoundingClientRect();
		if (!rect) return;
		const newValue = clamp(
			minValue,
			Math.round(
				(clamp(0, (clientX - rect.left) / rect.width, 1) *
					(maxValue - minValue) +
					minValue) /
					majorStep,
			) * majorStep,
			maxValue,
		);
		if (newValue !== value) {
			setValue(newValue);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => onChange(newValue));
		}
	};

	const onDragStop = () => {
		rectRef.current = null;
		setIsDragging(false);
	};

	const onUp = () => {
		const newValue = clamp(
			minValue,
			(Math.floor(value / minorStep) + 1) * minorStep,
			maxValue,
		);
		if (newValue !== value) {
			setValue(newValue);
			onChange(newValue);
		}
	};

	return (
		<div className={`slider ${className}`}>
			<div className="body">
				<button onPointerDown={onDown}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8.03866 13.3333C6.55732 13.3333 5.29799 12.8147 4.26066 11.7773C3.22332 10.74 2.70488 9.48088 2.70532 7.99999C2.70532 6.90221 3.01932 5.89444 3.64732 4.97666C4.27577 4.05799 5.16688 3.39732 6.32066 2.99466C6.45666 2.9471 6.57577 2.93466 6.67799 2.95732C6.78021 2.97999 6.86488 3.02421 6.93199 3.08999C6.9991 3.15577 7.04177 3.24021 7.05999 3.34332C7.07777 3.44688 7.06377 3.55555 7.01799 3.66932C6.93177 3.88132 6.8691 4.0971 6.82999 4.31666C6.79088 4.53621 6.77154 4.76399 6.77199 4.99999C6.77199 6.18799 7.18599 7.19621 8.01399 8.02466C8.84243 8.85266 9.85066 9.26666 11.0387 9.26666C11.3489 9.26666 11.6327 9.23377 11.89 9.16799C12.1478 9.10221 12.3673 9.04888 12.5487 9.00799C12.6455 8.99021 12.7342 8.99244 12.8147 9.01466C12.8951 9.03688 12.96 9.07599 13.0093 9.13199C13.0604 9.18755 13.0951 9.25599 13.1133 9.33733C13.1315 9.41866 13.1211 9.51133 13.082 9.61533C12.7642 10.7042 12.1413 11.596 11.2133 12.2907C10.2853 12.9853 9.2271 13.3329 8.03866 13.3333Z"
							fill="currentColor"
						/>
					</svg>
				</button>
				<div
					ref={trackRef}
					className={`track ${isDragging ? "dragging" : ""}`}
					style={{
						"--position": `${(100 * (maxValue - value)) / (maxValue - minValue)}%`,
					}}
					onPointerDown={(e) => {
						e.currentTarget.setPointerCapture(e.pointerId);
						rectRef.current =
							e.currentTarget.getBoundingClientRect();
						setIsDragging(true);
						onDrag(e.clientX);
					}}
					onPointerMove={(e) => {
						if (isDragging) onDrag(e.clientX);
					}}
					onPointerUp={onDragStop}
					onPointerCancel={onDragStop}
				>
					{onDisplay(value)}
				</div>
				<button onPointerDown={onUp}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M8.66666 12.6667V15.3333H7.33331V12.6667H8.66666ZM11.7712 10.8284L13.6568 12.714L12.714 13.6568L10.8284 11.7712L11.7712 10.8284ZM4.22875 10.8284L5.17156 11.7712L3.28594 13.6568L2.34313 12.714L4.22875 10.8284ZM8 4.35478C10.0132 4.35478 11.6452 5.98678 11.6452 8C11.6452 10.0132 10.0132 11.6452 8 11.6452C7.52105 11.6461 7.04663 11.5525 6.60395 11.3696C6.16128 11.1867 5.75907 10.9183 5.4204 10.5796C5.08173 10.2409 4.81325 9.83871 4.63038 9.39604C4.44751 8.95337 4.35384 8.47895 4.35475 8C4.35475 5.98678 5.98678 4.35478 8 4.35478ZM15.3333 7.33331V8.66666H12.6667V7.33331H15.3333ZM3.33331 7.33331V8.66666H0.666656V7.33331H3.33331ZM3.28594 2.34313L5.17156 4.22875L4.22875 5.17156L2.34313 3.28594L3.28594 2.34313ZM12.7141 2.34313L13.6568 3.28594L11.7712 5.17156L10.8284 4.22875L12.7141 2.34313ZM8.66663 0.666656V3.33331H7.33328V0.666656H8.66663Z"
							fill="currentColor"
						/>
					</svg>
				</button>
			</div>
			<h4>
				<span>{title}</span>
			</h4>
		</div>
	);
}
