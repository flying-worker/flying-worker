import { LabelHTMLAttributes } from "react";

export default function InputLabel({
	value,
	className = "",
	children,
	htmlFor = "",
	...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
	return (
		<label
			{...props}
			className={`block font-medium text-gray-700 text-sm dark:text-gray-300 ${className}`}
			for={htmlFor}
		>
			{value ? value : children}
		</label>
	);
}
