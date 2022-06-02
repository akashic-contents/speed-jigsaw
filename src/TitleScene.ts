import { SpriteFactory } from "./SpriteFactory";
import { AudioPresenter } from "./AudioPresenter";
import { AStage } from "./AStage";

export class TitleScene extends AStage {
	private scene: g.Scene;
	private title: g.Sprite;

	constructor(scene: g.Scene) {
		super();
		this.scene = scene;
	}

	activate(_s: g.Scene): void {
		AudioPresenter.instance.playBGM("bgm_130");
		const s = SpriteFactory.createTitle(_s);
		s.touchable = true;
		s.x = (_s.game.width - s.width) / 2;
		s.y = (_s.game.height - s.height) / 2;
		s.modified();

		// let ap = null;
		_s.setTimeout(
			() => {
				// ap = AudioPresenter.instance.playSE("se_002c");

				_s.setTimeout(
					() => {
						// 次のシーンへ行く何か
						this.finishStage();
					},
					1000
				);
			},
			5000
		);

		this.title = s;
		_s.append(s);
		this.scene = _s;
	}

	dispose() {
		if (this.title.destroyed()) {
			return;
		}
		this.title.destroy();
	}
}
