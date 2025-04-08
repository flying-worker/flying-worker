import {
  Application_default,
  getEnv
} from "./chunk-OP4GREOT.js";

// src/queue/index.ts
var queue = {
  send: async (event, payload, delaySeconds) => {
    const getQueueConneciton = getEnv(Application_default.config.queue.bindingName);
    await getQueueConneciton.send(
      { event, payload },
      { delaySeconds }
    );
  }
};

export {
  queue
};
