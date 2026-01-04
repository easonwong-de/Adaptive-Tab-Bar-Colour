import { useState } from "react";

export default function Slider({
	className = "",
	title,
	icon,
	minValue,
	maxValue,
	minorStep,
	majorStep,
	onChange,
	onDisplay = (value) => `${value} %`,
	initialValue = minValue,
}) {
	const [value, setValue] = useState(initialValue);
	return (
		<div className={`slider ${className}`}>
			<div className="slider-body">
				<button
					onPointerDown={() => {
						const nextValue =
							(Math.ceil(value / majorStep) - 1) * majorStep;
						setValue(Math.max(nextValue, minValue));
					}}
				>
					-
				</button>
				<div
					className="track"
					style={{
						"--position": `${(100 * (maxValue - value)) / (maxValue - minValue)}%`,
					}}
				>
					{onDisplay(value)}
				</div>
				<button
					onPointerDown={() => {
						const nextValue =
							(Math.floor(value / majorStep) + 1) * majorStep;
						setValue(Math.min(nextValue, maxValue));
					}}
				>
					+
				</button>
			</div>
			<h4>
				<span>{title}</span>
			</h4>
		</div>
	);
}
