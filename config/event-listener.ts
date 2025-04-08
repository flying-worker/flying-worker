import MainEventListener from "../Listener/MainEventListener";
import TestQueuedEventListener from "../Listener/TestQueuedEventListener";
import { Events } from "../src/type-declaration";

export const eventListener: Events = {
	"update-product": () => {},
	"update-admin": MainEventListener,
	"ai-process": TestQueuedEventListener,
};
