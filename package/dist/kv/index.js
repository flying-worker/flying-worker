import {
  getEnv,
  parseLifetime
} from "../chunk-GZC4R7XI.js";
import "../chunk-ZRMMBKT4.js";
import "../chunk-TZBUJ5UG.js";
import "../chunk-WMP6M3KL.js";
import "../chunk-K6PJSREV.js";
import "../chunk-K4FR6TDS.js";
import "../chunk-WJLLJLLI.js";
import "../chunk-4IX6YY4Z.js";

// src/kv/index.ts
var KvNamespace = getEnv(getEnv("KV_BINDING_NAME", "kv"));
var KV = {
  set: async (key, value, expiry = "5d") => {
    const data = { data: value };
    const ttl = typeof expiry === "number" ? expiry : parseLifetime(expiry);
    await KvNamespace.put(key, JSON.stringify(data), {
      expirationTtl: ttl
    });
  },
  get: async (key) => {
    const data = await KvNamespace.get(key);
    if (data) {
      const value = JSON.parse(data);
      return value.data;
    }
    return null;
  },
  delete: (key) => {
    KvNamespace.delete(key);
  },
  list: async () => {
    return await KvNamespace.list();
  }
};
export {
  KV
};
