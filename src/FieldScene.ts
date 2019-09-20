import * as tl from "@akashic-extension/akashic-timeline";
import { GameTimer } from "./GameTimer";
import { Global } from "./Global";
import { AudioPresenter } from "./AudioPresenter";
import { FieldScore } from "./FieldScore";
import { ReadyGo } from "./ReadyGo";
import { AStage } from "./AStage";
import { OuterParamReceiver } from "./OuterParamReceiver";
import { GameField, LevelData } from "./GameField";
import { easeOutQuad, easeInQuint } from "@akashic-extension/akashic-timeline/lib/Easing";
import { Queue } from "./Queue";
import { TimeOver } from "./TimeOver";
import { ComboView } from "./ComboView";
import { Util } from "./Util";

export class FieldScene extends AStage {

	private static readonly TIMER_MERGIN: number = 22;
	private static readonly TIMER_MAX: number = 99;
	private static readonly MAX_LEVEL: number = 10;
	private static readonly BG_NUM: number = 4;

	private static readonly FIELDSCORE_POS_X: number = 552;
	private static readonly FIELDSCORE_POS_Y: number = 0;
	private static readonly GAMETIMER_POS_X: number = 82;
	private static readonly GAMETIMER_POS_Y: number = 4;

	private static readonly FIRSTGAME_DELAY: number = 1500;
	private static readonly GAME_DELAY: number = 1000;
	private static readonly TRANSIT_WAIT: number = 800;

	private static readonly COMBO_SCORE_RATIO: number = 5;
	private static readonly SCORE_TOP: number = 100;
	private static readonly STAGE_CLEAR_BONUS: number = 300;

	private timer: GameTimer;
	private scoreView: FieldScore;
	private fieldTouchMask: g.FilledRect;

	private firstLevelNum: number = 1;

	private level: number = 1;
	private score: number = 0;
	private combo: number = 0;

	private BG: g.E[] = [];

	private scene: g.Scene = null;
	private readyGo: ReadyGo = null;
	private comboView: ComboView = null;
	private elapsedStartTime: number = 0;
	private answerElapsedTime: number = 0;
	private seethroughRemainTime: number = 0;

	private gf: Queue<GameField> = new Queue<GameField>();

	private pause: boolean = false;

	private pictureNumberTable: number[] = [];
	private lastSelectPictureNumber: number = -1;

	constructor(_scene: g.Scene) {
		super();
		this.scene = _scene;
	}

	activate(_scene: g.Scene) {
		this.pause = false;
		const _sv = new FieldScore(_scene);

		for (let i = 0, max = FieldScene.BG_NUM; i < max; ++i) {
			const _e = new g.E({scene: _scene});
			this.BG.push(_e);
		}
		for (let i = 0, max = FieldScene.BG_NUM; i < max; ++i) {
			_scene.append(this.BG[max - i - 1]);
		}

		_sv.init(_scene);
		this.BG[1].append(_sv.rootEntity);
		_sv.show(_scene, FieldScene.FIELDSCORE_POS_X, FieldScene.FIELDSCORE_POS_Y);
		_sv.value = this.score;
		this.scoreView = _sv;

		let gt = Global.instance.totalTimeLimit - FieldScene.TIMER_MERGIN;
		if (FieldScene.TIMER_MAX < gt) {
			gt = FieldScene.TIMER_MAX;
		}

		const cv = new ComboView(_scene);
		cv.x = 201;
		cv.y = 4;
		cv.modified();
		this.BG[1].append(cv);
		this.comboView = cv;

		const t = new GameTimer(_scene);
		t.show(
			FieldScene.GAMETIMER_POS_X,
			FieldScene.GAMETIMER_POS_Y,
			gt
		);

		const _ft = new g.FilledRect(
			{
				scene: _scene,
				width: _scene.game.width,
				height: _scene.game.height,
				cssColor: "#000000",
				opacity: 0,
				touchable: true
			});
		this.BG[0].append(_ft);
		this.fieldTouchMask = _ft;

		this.BG[1].append(t.rootEntity);
		this.timer = t;

		const _readygo = new ReadyGo(_scene);
		this.readyGo = _readygo;

		this.combo = 0;

		this.BG[0].append(_readygo.rootEntity);

		let difficulty = Global.instance.difficulty;
		if (Global.instance.DEBUG) {
			difficulty = 4;
		}
		if (difficulty < 1) {
			difficulty = 1;
		}
		this.level = Math.max(1, Math.min(10, difficulty));

		// 最初の設定
		const remainTime = this.generateRemainTime(this.level);
		this.seethroughRemainTime = remainTime;
		this.createGameField(this.level, remainTime, FieldScene.FIRSTGAME_DELAY);

		this.scene.setInterval(
			() => {
				this.elapsedStartTime += 100;
			},
			100
		);

		_readygo.show().finishCallback.push(this.gameStartInit.bind(this));
	}

	gameStartInit(): void {
		const t = this.timer;
// 		this.elapsedStartTime = t.now;

		this.gf.peek().gameStart();

		this.questStart();
		t.start()
			.finishCallback.push(
				() => {
					if (!Global.instance.DEBUG) {
						this.fieldTouchMask.show();
						const _eff = new TimeOver(this.scene);

						this.BG[0].append(_eff.rootEntity);
						_eff.show(250, 500).finishCallback.push(
							() => {
								this.fieldTouchMask.show();
								this.sceneFinish();
						});
					}
				}
			);

		AudioPresenter.instance.playBGM("bgm_130");
		this.fieldTouchMask.hide();
	}

	dispose(): void {
		if (this.BG[3].destroyed()) {
			return;
		}
		this.BG[3].destroy();
		this.BG[2].destroy();
		this.BG[1].destroy();
	}

	private generateRemainTime(lv: number) {
		// 1 + (難易度 * 0.5秒)...?
		let time = ((10 - (lv - 1)) * 0.5) + 1;
		if (time < 1) {
			time = 1;
		}
		if (6 < time) {
			time = 6;
		}

		return time * 1000;
	}

	private createGameField(level: number, remain: number, startDelay: number = 0) {

		Global.instance.log("createGameField:" + level);

		const lv = LevelData.getLevelInfo(level);

		const g = new GameField(this.scene, this.getPictureNumber(), level, startDelay);
		g.onPieceMatchCheck.push(
			(idx, result, remainp) => {
				if (result) {
					this.combo++;
					const score = this.generateAppendScore(remainp === 0);
					let comboBonus = 0;
					if (1 < this.combo) {
						comboBonus = this.combo * FieldScene.COMBO_SCORE_RATIO;
					}
					this.addScore(score + comboBonus);
				} else {
					this.combo = 0;
				}
				this.comboView.Value = this.combo;
			});
		g.clearCallback.push(
			() => {
				this.allRemain(750);
			});
		if (!this.gf.IsEmpty) {
			g.x = this.scene.game.width;
			g.modified();
		}

		this.BG[3].append(g);
		this.gf.push(g);
	}

	private allRemain(delay: number) {
		this.scene.setTimeout(
			() => {
				if (!Global.instance.DEBUG) {
					if (this.timer.now <= 0) {
						return;
					}
				}
				this.levelUpAction();
				this.createGameField(this.level, 0, FieldScene.GAME_DELAY);
				this.transitNextQuestionAsync(FieldScene.TRANSIT_WAIT);
			},
			delay
		);
	}

	private levelUpAction() {
		this.level++;
		if (FieldScene.MAX_LEVEL <= this.level) {
			this.level = FieldScene.MAX_LEVEL;
		}
	}

	private generateAppendScore(isClear: boolean = false) {
		const nt = this.elapsedStartTime;
		let score = FieldScene.SCORE_TOP - (((nt - this.answerElapsedTime) / 100) | 0);

		if (score < 0) {
			score = 1;
		}

		if (isClear) {
			score += FieldScene.STAGE_CLEAR_BONUS;
		}

		return score | 0;
	}

	private addScore(add: number) {
		this.score += add;
		this.scoreView.value = this.score;
		OuterParamReceiver.setGlobalScore(this.score);
	}

	private transitNextQuestionAsync(animationTime: number) {
		const _tl = new tl.Timeline(this.scene);

		const bgId = 3;

		_tl.create(this.BG[bgId], {modified: this.BG[bgId].modified, destroyed: this.BG[bgId].destroyed})
			.moveX(-(this.scene.game.width), animationTime, easeOutQuad)
			.con()
			.every(
				(e, p) => {
					if (p < 1) {
						return;
					}
					this.BG[bgId].x = 0;
					this.BG[bgId].modified();

					const disposedObject = this.gf.pop();
					disposedObject.dispose();

					const currentObject = this.gf.peek();
					currentObject.x = 0;
					currentObject.modified();

					currentObject.gameStart();

					this.questStart();
					_tl.destroy();
				},
				animationTime);
	}

	private sceneFinish() {
		Global.instance.score = this.score;
		AudioPresenter.instance.stopBGM();
		for (let n = 1, max = 3; n <= max; ++n) {
			this.BG[n].opacity = 0;
			this.BG[n].modified();
		}
		this.finishStage();
	}

	private questStart() {
		this.fieldTouchMask.hide();
		this.answerElapsedTime = this.elapsedStartTime;
	}

	private getPictureNumber(): number {
		if (this.pictureNumberTable.length < 1) {
			this.pictureNumberTable = Util.shuffle(Util.range(0, 5));
			if (this.pictureNumberTable[0] === this.lastSelectPictureNumber) {
				const n = this.pictureNumberTable[0];
				this.pictureNumberTable[0] = 5;
				this.pictureNumberTable.push(n);
			}
		}

		this.lastSelectPictureNumber = this.pictureNumberTable.pop();
		return this.lastSelectPictureNumber;
	}
}
