import {
  Application_default,
  getEnv
} from "./chunk-GZC4R7XI.js";

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
