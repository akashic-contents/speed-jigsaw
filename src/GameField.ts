import { SpriteFactory } from "./SpriteFactory";
import { Global } from "./Global";
import { Util } from "./Util";
import { AudioPresenter } from "./AudioPresenter";
import { Picture } from "./Picture";
import { PieceSelectField, PieceSize } from "./PieceSelectField";
import { RemainPieceView } from "./RemainPieceView";

class LevelParam {
	divX: number;
	divY: number;
	pieceSize: PieceSize;
}

export class LevelData {

	static readonly LEVEL_MIN: number = 1;
	static readonly LEVEL_MAX: number = 10;

	static getLevelInfo(lv: number): LevelParam {
		const nlv = Math.max(LevelData.LEVEL_MIN, Math.min(lv, Math.min(LevelData.LEVEL_MAX, LevelData.levelInfo.length))) - 1;
		return LevelData.levelInfo[nlv];
	}

	private static readonly levelInfo: LevelParam[] = [
		{ divX: 2, divY: 2, pieceSize: PieceSize.L },
		{ divX: 3, divY: 3, pieceSize: PieceSize.M },
		{ divX: 3, divY: 3, pieceSize: PieceSize.M },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S },
		{ divX: 4, divY: 4, pieceSize: PieceSize.S }
	];

}

export class GameField extends g.E {

	private static readonly POS_X: number = 69;
	private static readonly POS_Y: number = 51;

	private static readonly PIC_OFFSET_X: number = 15;
	private static readonly PIC_OFFSET_Y: number = 15;

	private static readonly SELECTFRAME_BASE_X: number = 385;
	private static readonly SELECTFRAME_BASE_Y: number = 118;

	private static readonly COMBO_BASE_X: number = 201; // 191;
	private static readonly COMBO_BASE_Y: number = 3; // 7;

	onPieceMatchCheck: Array<(idx: number, success: boolean, remain: number) => void> = [];
	clearCallback: Array<() => void> = [];

	private touchLayer: g.E = null;
	private pieceLayer: g.E = null;
	private baseLayer: g.E = null;

	private pic: Picture = null;
	private pieceField: PieceSelectField = null;
	private remainView: RemainPieceView = null;

	private selectPieceIndex: number = -1;
	private pieceNum: number = 0;

	constructor(s: g.Scene, pictureId: number, level: number, delay: number = 0) {
		super({scene: s});

		Global.instance.log("GameField: " + pictureId.toString());

		this.baseLayer = new g.E({scene: s});
		this.append(this.baseLayer);

		this.touchLayer = new g.E({scene: s});
		const lvinfo = LevelData.getLevelInfo(level);

		this.createFieldImage(this.baseLayer);

		const pic = new Picture(s, pictureId, lvinfo.divX, lvinfo.divY);
		pic.x = GameField.PIC_OFFSET_X;
		pic.y = GameField.PIC_OFFSET_Y;
		pic.modified();
		this.baseLayer.append(pic);

		this.pieceNum = pic.Pieces.length;

		const rpv = new RemainPieceView(s);
		rpv.x = GameField.SELECTFRAME_BASE_X - GameField.POS_X;
		rpv.y = -1;
		rpv.modified();
		this.remainView = rpv;
		this.baseLayer.append(rpv);

		const pf = new PieceSelectField(s, lvinfo.pieceSize, pic.Pieces);
		pf.x = GameField.SELECTFRAME_BASE_X - GameField.POS_X;
		pf.y = GameField.SELECTFRAME_BASE_Y - GameField.POS_Y;
		pf.onTouchGetPiece.push(
			(idx) => {
				Global.instance.log("onTouchGetPiece(" + idx + ")");
				this.selectPieceIndex = idx;
				return true;
			});

		pf.onSlideInFinish.push((f, p) => {
			if (pf.selectFrameIndex !== f) {
				return;
			}
			Global.instance.log("onSlideInFinish(" + f + "," + p + ")");
			this.selectPieceIndex = p;
		});

		this.onPieceMatchCheck.push(
			(idx, success, remain) => {
				let seId = "se_004";
				const tx = this.touchLayer.children[idx];
				tx.tag = 0;
				tx.opacity = 0;
				tx.modified();

				if (success) {
					seId = "se_003";

					this.pieceNum--;
					if (0 <= this.pieceNum) {
						rpv.Num = this.pieceNum;
					}

					const p = pic.Pieces[idx];
					this.createCorrectPieceAndAction(this.baseLayer, p, tx);
					p.hide();

					pf.releaseSelectObject();
					if (0 < remain) {
						// 次のpiece
						pf.get();
					} else {
						if (this.pieceNum <= 0) {
							this.clearCallback.forEach(x => x());
						} else {
							this.scene.setTimeout(
								() => {
									pf.setNextSelectFrame();
								},
								10
							);
						}
					}
				}

				AudioPresenter.instance.playSE(seId);
			});

		rpv.Num = pf.RemainNum;

		this.baseLayer.append(pf);
		this.pieceField = pf;

		this.createFrameTouchField(this.touchLayer, lvinfo.divX, lvinfo.divY);
		this.touchLayer.x = pic.x;
		this.touchLayer.y = pic.y;
		this.touchLayer.modified();
		this.baseLayer.append(this.touchLayer);

		this.baseLayer.x = GameField.POS_X;
		this.baseLayer.y = GameField.POS_Y;
		this.baseLayer.modified();

		if (0 < delay) {
			s.setTimeout(
				() => {
					if (this.destroyed()) {
						return;
					}
					if (pic.destroyed()) {
						return;
					}
					const pi = pic.Image;
					pi.update.add(
						() => {
							pi.opacity = Util.lerp(pi.opacity, 0, 0.3, 0.08);
						});
				},
				delay
			);
		}
	}

	dispose() {
		this.destroy();
	}

	gameStart() {
		this.pieceField.get();
	}

	private createFieldImage(e: g.E) {
		const base = SpriteFactory.createPictureFrame(this.scene);
		e.append(base);
	}

	private createFrameTouchField(e: g.E, divX: number, divY: number) {

		const dw = (Picture.IMAGE_PIX / divX) | 0;
		const dh = (Picture.IMAGE_PIX / divY) | 0;

		for (let dy = 0; dy < divY; ++dy) {
			for (let dx = 0; dx < divX; ++dx) {
				const idx = dx + (dy * divX);
				const panel = new g.FilledRect({
					scene: this.scene,
					x: dx * dw,
					y: dy * dh,
					width: dw,
					height: dh,
					cssColor: "#c0c000",
					opacity: 0,
					touchable: true
				});
				panel.tag = 0;

				panel.update.add(
					() => {
						panel.opacity = Util.lerp(panel.opacity, panel.tag, 0.4);
						panel.modified();
					});
				panel.pointDown.add(() => {
					panel.tag = 0.5;
				});
				panel.pointUp.add(() => {
					if (this.selectPieceIndex !== idx) {
						panel.tag = 0;
						panel.opacity = 0;
						panel.modified();
					}
					const disable = this.OnTouchCallback(idx);
					if (disable) {
						panel.touchable = false;
					}
				});

				e.append(panel);
			}
		}
	}

	private OnTouchCallback(idx: number): boolean {
		Global.instance.log("fieldTouch: " + idx + " / " + this.selectPieceIndex);
		if (this.selectPieceIndex < 0) {
			return;
		}
		const remainNum = this.pieceField.RemainNum;
		this.onPieceMatchCheck.forEach(x => {
			x(idx, idx === this.selectPieceIndex, remainNum);
		});

		return idx === this.selectPieceIndex;
	}

	private createCorrectPieceAndAction(e: g.E, p: g.E, t: g.E) {

		const move = 0.4;
		const th = 0.03;
		const tp = {x: t.x, y: t.y};
		const nss = g.Util.createSpriteFromE(this.scene, p);
		const ns = new g.E({scene: this.scene});
		const wp = Util.getWorldPos(p);

		nss.x = p.children[0].x;
		nss.y = p.children[0].y;
		nss.modified();
		ns.append(nss);

		ns.x = wp.x;
		ns.y = wp.y;
		ns.modified();
		e.append(ns);

		if (t.parent !== undefined) {
			if (t.parent !== null) {
				const te = t.parent as g.E;
				if (te instanceof g.E) {
					tp.x += te.x;
					tp.y += te.y;
				}
			}
		}

		ns.update.add(
			() => {
				// 目的地へ移動する
				ns.x = Util.lerp(ns.x, tp.x, move, th);
				ns.y = Util.lerp(ns.y, tp.y, move, th);
				ns.modified();
			});

		ns.show();
	}
}
