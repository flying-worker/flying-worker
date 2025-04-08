import React from "react";

const ApplicationLogo: React.FC = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 100 100"
		className="h-16 w-16"
		role="img"
		aria-labelledby="application-logo-title"
	>
		<title id="application-logo-title">
			Application Logo - Cloud with Lightning Bolt
		</title>
		<path
			d="M25 55
			   C25 45 30 40 40 40
			   C40 30 50 25 60 25
			   C70 25 80 35 80 45
			   C90 45 95 50 95 60
			   C95 70 90 75 80 75
			   H30
			   C20 75 15 70 15 60
			   C15 55 20 55 25 55"
			fill="none"
			stroke="#3b82f6"
			strokeWidth={4}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M55 35 L40 55 L55 55 L45 75"
			fill="none"
			stroke="#3b82f6"
			strokeWidth={4}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export default ApplicationLogo;
