import { useState } from "react";

export default function Switch({
	className = "",
	itemList,
	onSelect,
	initialActiveIndex = 0,
}) {
	const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
	return (
		<div className={`switch ${className}`}>
			{itemList.map((item, index) => {
				return (
					<button
						key={`switch${item}${index}`}
						className={activeIndex === index ? "active" : ""}
						onClick={() => {
							setActiveIndex(index);
							onSelect(index);
						}}
					>
						{className.includes("tab-switch") ? (
							<h2>{item}</h2>
						) : (
							<div>{item}</div>
						)}
					</button>
				);
			})}
		</div>
	);
}
