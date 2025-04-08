declare const queue: {
    send: (event: string, payload: {
        [key: string]: any;
    }, delaySeconds: number) => Promise<void>;
};

export { queue };
