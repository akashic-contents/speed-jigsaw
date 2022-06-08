import { AStage } from "./AStage";
import { SpriteFactory } from "./SpriteFactory";

export class ManualScene extends AStage {
	private scene: g.Scene;
	private title: g.Sprite;

	constructor(scene: g.Scene) {
		super();
		this.scene = scene;
	}

	activate(_s: g.Scene): void {
		const s = SpriteFactory.createManual(_s);
		s.x = (_s.game.width - s.width) / 2;
		s.y = (_s.game.height - s.height) / 2;
		s.modified();

		_s.setTimeout(
			() => {
				this.finishStage();
			},
			5000,
			this
		);

		this.title = s;
		_s.append(s);
		this.scene = _s;
	}

	dispose(): void {
		if (this.title.destroyed()) {
			return;
		}
		this.title.destroy();
	}
}
