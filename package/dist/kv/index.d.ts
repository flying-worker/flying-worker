declare const KV: {
    set: (key: string, value: any, expiry?: string | number) => Promise<void>;
    get: (key: string) => Promise<any>;
    delete: (key: string) => void;
    list: () => Promise<any>;
};

export { KV };
