import { raw } from "hono/html";
import type { InertiaRootViewProps } from "flying-worker/type-declaration";

/**
 * Root HTML document for this application, rendered with hono/jsx on the server.
 * Registered via config.inertia.rootView (see config/inertia.ts).
 *
 * `data-page` is a JSX attribute, so the page JSON is escaped automatically.
 * Vite assets (scripts/styles + dev preamble) are injected raw.
 */
export default function AppDocument({ page, assets, head }: InertiaRootViewProps) {
	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{head ? raw(head) : ""}
				{raw(assets)}
			</head>
			<body>
				<div id="app" data-page={JSON.stringify(page)}></div>
			</body>
		</html>
	);
}
