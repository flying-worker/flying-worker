declare abstract class BaseListener {
    abstract process(): Promise<void>;
}

export { BaseListener as default };
