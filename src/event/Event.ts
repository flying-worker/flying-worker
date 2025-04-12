import { App } from "../core";
import { queue } from "../queue";
import BaseListener from "./BaseListener";

// Define the types for event arguments and listeners
type EventArgs = any[]; // Consider making this more specific based on event types
type CallbackListener = (...args: EventArgs) => Promise<void> | void;
type ClassListener = new (...args: EventArgs) => BaseListener;
type Listener = CallbackListener | ClassListener;

// Function to check if a listener is a class listener
function isClassListener(listener: Listener): listener is ClassListener {
	return (
		typeof listener === "function" &&
		"prototype" in listener &&
		listener.prototype instanceof BaseListener
	);
}

// Function to check if a listener is a callback function
function isCallbackFuncListener(
	listener: Listener,
): listener is CallbackListener {

	return (
		typeof listener === "function" &&
		!(
			"prototype" in listener &&
			Object.getOwnPropertyNames(listener.prototype).length > 1
		)
	);
}

// Function to parse delay duration
function parseDelay(duration: string | number): number {
	if (typeof duration === "number") {
		return duration > 43200 ? 43200 : duration;
	}

	const match = duration.match(/^(\d+)([smh])$/);
	if (!match) throw new Error("Invalid delay format");

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	let seconds = 0;
	switch (unit) {
		case "s":
			seconds = value;
			break;
		case "m":
			seconds = value * 60;
			break;
		case "h":
			seconds = value * 60 * 60;
			break;
		default:
			throw new Error("Invalid duration unit");
	}

	return seconds > 43200 ? 43200 : seconds;
}

// Function to handle listener execution
async function handleListener(
	listener: Listener,
	...args: EventArgs
): Promise<void> {
	try {
		if (isClassListener(listener)) {
			const instance = new listener(...args);
			if (instance instanceof BaseListener) {
				await instance.process();
			}
		} else if (isCallbackFuncListener(listener)) {
			await listener(...args);
		} else {
			throw new Error("Unhandled listener");
		}
	} catch (error) {
		console.error("Error in event listener:", error);
	}
}

// Class to handle event dispatching with optional delay
class EventDispatcher {
	private readonly eventName: string;
	private readonly args: EventArgs;
	private processCalled: boolean;

	constructor(eventName: string, ...args: EventArgs) {
		this.eventName = eventName;
		this.args = args;
		this.processCalled = false;
	}

	// Method to delay the event processing
	/**
	 *
	 * @param delay like :
	 *   5 - as second - number
	 *  '5s' - as seconds - string
	 *  '5m' - as minutes - string
	 *  '5h' - as hours - string
	 */
	async delay(delay: number | string = 1): Promise<void> {
		const delaySeconds = parseDelay(delay);
		if (!this.processCalled) {
			await queue.send(this.eventName, this.args, delaySeconds);
		}
	}

	// Method to process the event immediately
	async process(): Promise<void> {
		if (!this.processCalled) {
			this.processCalled = true;
			const eventListeners = App.config.eventListener[this.eventName];

			if (!eventListeners) {
				throw new Error("Event not found");
			}

			// Process all listeners for this event
			for (const listener of Array.isArray(eventListeners)
				? eventListeners
				: [eventListeners]) {
				await handleListener(listener, ...this.args);
			}
		}
	}
}

// Export the Event object with the dispatch method
export const Event = {
	/**
	 * Dispatch an event to all registered listeners
	 * @param event Event name
	 * @param args Arguments to pass to the listeners
	 */
	dispatch: (event: string, ...args: EventArgs): EventDispatcher => {
		return new EventDispatcher(event, ...args);
	},
};
