import { BaseListener } from "../src/event";

export default class TestQueuedEventListener extends BaseListener {
	async process(): Promise<void> {
		return await (async () => {})();
	}
}
