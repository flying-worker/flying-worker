import { BaseListener } from "../src/event";

export default class MainEventListener extends BaseListener {

	private readonly name: string

	constructor(name: string) {
		super();
		this.name = name
	}

	async process(): Promise<void> {

		console.log("success...", this.name)
	}
}
