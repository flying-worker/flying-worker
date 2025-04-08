abstract class BaseListener {
	abstract process(): Promise<void>;
}

export default BaseListener;
