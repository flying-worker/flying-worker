import { ReactRoute } from "../src/route";

/**
 * Registers a route to a Remix page.
 *
 * The `filePath` parameter should be a path relative to the `./app/remix` or `app/remix` directory.
 * This means you only need to provide the path inside the `app/remix` folder, e.g.:
 * - `'pages/Index.tsx'`
 * - `'pages/OtherPage.tsx'`
 *
 * @param {string} route - The URL route (e.g., `"/"`).
 * @param {string} filePath - The file path relative to the `./app/remix` directory (e.g., `"app/remix/pages/Index.tsx"`).
 */

ReactRoute("/", "./resources/react/pages/Index.tsx");
ReactRoute("/login", "./resources/react/pages/Login.tsx");

ReactRoute(
	"/product",
	async () => {
		ReactRoute("/", "./resources/react/pages/KV.tsx");
	},
	["test"],
);
