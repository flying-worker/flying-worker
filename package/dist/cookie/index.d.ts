declare function parseLifetime(duration: string): number;
declare const Cookie: {
    set: (name: string, value: string, maxAge?: string | number | null) => void;
    get: (name: string) => Promise<string | false | undefined>;
    delete: (name: string) => void;
};

export { Cookie, parseLifetime };
