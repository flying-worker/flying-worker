import { App } from "../core";

export function DB(connection?: "d1" | string) {
	const type = connection || App.config.db.default;

	if (type && App.config.db.connections[type]) {
		return App.config.db.connections[type].connection();
	}

	throw new Error(`Unsupported database connection: ${type}`);
}
