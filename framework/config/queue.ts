import { getEnv } from "flying-worker/core";
import { QueueConfig } from "flying-worker/type-declaration";

export const queue: QueueConfig = {
	bindingName: getEnv("QUEUE_BINDING_NAME", "MY_QUEUE") as string,
	syncQueue: getEnv("SYNC_QUEUE", false) as boolean,
};
