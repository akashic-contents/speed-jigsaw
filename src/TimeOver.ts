import { Timeline } from "@akashic-extension/akashic-timeline";
import { AudioPresenter } from "./AudioPresenter";
import { SpriteFactory } from "./SpriteFactory";

export class TimeOver {

	rootEntity: g.E;
	finishCallback: Array<() => void> = new Array<() => void>();

	private _s: g.Scene;
	private timeUp: g.Sprite;

	constructor(_s: g.Scene) {
		this._s = _s;
		this.rootEntity = new g.E({scene: _s});

		const _t = SpriteFactory.createTimeUp(_s);

		_t.x = (_s.game.width - _t.width) / 2;
		_t.y = (_s.game.height - _t.height) / 2;
		_t.modified();
		_t.hide();

		this.timeUp = _t;

		this.rootEntity.append(_t);
	}

	show(intime: number, wait: number): TimeOver {
		const tt = new Timeline(this._s);

		AudioPresenter.instance.playSE("se_006B_mono");

		const _tu = this.timeUp;
		_tu.scale(1.5);
		_tu.opacity = 0;
		_tu.modified();
		_tu.show();

		tt.create(this.timeUp, { modified: this.timeUp.modified, destroyed: this.timeUp.destroyed})
			.scaleTo(1, 1, intime)
			.con()
			.fadeIn(intime)
			.wait(wait)
			.every(
				(_e, p) => {
					if (1 <= p) {
						tt.destroy();
						this.finishCallback.forEach(c => c());
						_tu.hide();
					}
				},
				(intime + wait)
			);

		return this;
	}
}
