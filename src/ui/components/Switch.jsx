import { useEffect, useState } from "react";

export default function Switch({
	className = "",
	itemList,
	initialActiveIndex = 0,
	onChange = () => {},
}) {
	const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
	useEffect(() => setActiveIndex(initialActiveIndex), [initialActiveIndex]);

	return (
		<div className={`switch ${className}`}>
			{itemList.map((item, index) => {
				return (
					<button
						key={`switch${item}${index}`}
						className={activeIndex === index ? "active" : ""}
						onClick={() => {
							setActiveIndex(index);
							onChange(index);
						}}
					>
						<div>{item}</div>
					</button>
				);
			})}
		</div>
	);
}
