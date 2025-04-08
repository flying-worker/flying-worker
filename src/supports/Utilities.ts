import { App } from "../core";

export const csrfToken = (): string => {
	return App.getCurrentState("csrfToken") ?? "";
};
