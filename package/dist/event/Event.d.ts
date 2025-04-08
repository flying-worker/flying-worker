type EventArgs = any[];
declare class EventDispatcher {
    private readonly eventName;
    private readonly args;
    private processCalled;
    constructor(eventName: string, ...args: EventArgs);
    /**
     *
     * @param delay like :
     *   5 - as second - number
     *  '5s' - as seconds - string
     *  '5m' - as minutes - string
     *  '5h' - as hours - string
     */
    delay(delay?: number | string): Promise<void>;
    process(): Promise<void>;
}
declare const Event: {
    /**
     * Dispatch an event to all registered listeners
     * @param event Event name
     * @param args Arguments to pass to the listeners
     */
    dispatch: (event: string, ...args: EventArgs) => EventDispatcher;
};

export { Event };
