import { BaseListener } from "../src/event";

export default class MainEventListener extends BaseListener {
	async process(): Promise<void> {
		return await (async () => {})();
	}
}
