export default function Glyph({ highlight }) {
	return (
		<svg
			className="glyph"
			width="84"
			height="56"
			viewBox="0 0 84 56"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect width="84" height="56" rx="4" fill="var(--glyph-background)" />
			<path
				d="M5 7C5 5.34315 6.34315 4 8 4H22.5C23.8807 4 25 5.11929 25 6.5C25 7.88071 23.8807 9 22.5 9H6C5.44772 9 5 8.55228 5 8V7Z"
				fill={
					highlight === "tab"
						? "var(--accent-primary)"
						: "var(--glyph-foreground)"
				}
			/>
			<path
				d="M5 12C5 11.4477 5.44772 11 6 11H36.5857C36.8173 11 36.9508 11.5384 36.7771 11.6915C36.3327 12.0834 35.9375 12.6662 35.9375 13.5C35.9375 14.3338 36.3327 14.9166 36.7771 15.3085C36.9508 15.4617 36.8173 16 36.5857 16H6C5.44771 16 5 15.5523 5 15V12Z"
				fill={
					highlight === "toolbar"
						? "var(--accent-primary)"
						: "var(--glyph-foreground)"
				}
			/>
			<path
				d="M79.0506 8.00012C79.0506 8.55241 78.6029 9.00012 78.0506 9.00012L26.4143 9.00011C26.1827 9.00011 26.0492 8.46177 26.2229 8.3086C26.6673 7.91675 27.0625 7.33389 27.0625 6.50011C27.0625 5.66634 26.6673 5.08348 26.2229 4.69163C26.0492 4.53845 26.1827 4.00011 26.4143 4.00011L76.0506 4.00012C77.7075 4.00012 79.0506 5.34327 79.0506 7.00012L79.0506 8.00012Z"
				fill={
					highlight === "tab-bar"
						? "var(--accent-primary)"
						: "var(--glyph-foreground)"
				}
			/>

			<path
				d="M5 19C5 18.4477 5.44772 18 6 18H28C28.5523 18 29 18.4477 29 19V50C29 50.5523 28.5523 51 28 51H8C6.34315 51 5 49.6569 5 48V19Z"
				fill={
					highlight === "sidebar"
						? "var(--accent-primary)"
						: "var(--glyph-foreground)"
				}
			/>
			{(() => {
				if (highlight === "popup") {
					return (
						<>
							<path
								d="M38 13.5C38 12.1193 39.1193 11 40.5 11H58V16H40.5C39.1193 16 38 14.8807 38 13.5V13.5Z"
								fill="var(--glyph-foreground)"
							/>
							<path
								d="M60 11H78C78.5523 11 79 11.4477 79 12V35C79 35.5523 78.5523 36 78 36H61C60.4477 36 60 35.5523 60 35V11Z"
								fill="var(--accent-primary)"
							/>
						</>
					);
				} else {
					return (
						<path
							d="M38 13.5C38 12.1193 39.1193 11 40.5 11H78C78.5523 11 79 11.4477 79 12V15C79 15.5523 78.5523 16 78 16H40.5C39.1193 16 38 14.8807 38 13.5Z"
							fill={
								highlight === "url-bar"
									? "var(--accent-primary)"
									: "var(--glyph-foreground)"
							}
						/>
					);
				}
			})()}
		</svg>
	);
}
