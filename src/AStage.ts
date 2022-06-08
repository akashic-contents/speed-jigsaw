export abstract class AStage {

	finishCallback: Array<() => void> = [];

	abstract activate(_s: g.Scene): void;
	abstract dispose(): void;

	finishStage(): void {
		this.finishCallback.forEach(cb => {
			cb();
		});
	}
}
