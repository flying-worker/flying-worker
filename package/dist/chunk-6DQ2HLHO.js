import {
  queue
} from "./chunk-MDBH627X.js";
import {
  Application_default
} from "./chunk-LIY7IDIW.js";
import {
  BaseListener_default
} from "./chunk-3CRIICYR.js";

// src/event/Event.ts
function isClassListener(listener) {
  return typeof listener === "function" && "prototype" in listener && listener.prototype instanceof BaseListener_default;
}
function isCallbackFuncListener(listener) {
  return typeof listener === "function" && !("prototype" in listener);
}
function parseDelay(duration) {
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
async function handleListener(listener, ...args) {
  try {
    if (isClassListener(listener)) {
      const instance = new listener(...args);
      if (instance instanceof BaseListener_default) {
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
var EventDispatcher = class {
  constructor(eventName, ...args) {
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
  async delay(delay = 1) {
    const delaySeconds = parseDelay(delay);
    if (!this.processCalled) {
      await queue.send(this.eventName, this.args, delaySeconds);
    }
  }
  // Method to process the event immediately
  async process() {
    if (!this.processCalled) {
      this.processCalled = true;
      const eventListeners = Application_default.config.eventListener[this.eventName];
      if (!eventListeners) {
        throw new Error("Event not found");
      }
      for (const listener of Array.isArray(eventListeners) ? eventListeners : [eventListeners]) {
        await handleListener(listener, ...this.args);
      }
    }
  }
};
var Event = {
  /**
   * Dispatch an event to all registered listeners
   * @param event Event name
   * @param args Arguments to pass to the listeners
   */
  dispatch: (event, ...args) => {
    return new EventDispatcher(event, ...args);
  }
};

export {
  Event
};
