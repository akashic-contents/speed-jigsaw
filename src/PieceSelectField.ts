import * as Enumerable from "linq/linq";
import { Timeline } from "@akashic-extension/akashic-timeline";
import { easeInCubic, easeOutQuart } from "@akashic-extension/akashic-timeline/lib/Easing";
import { SpriteFactory } from "./SpriteFactory";
import { Global } from "./Global";
import { Util } from "./Util";

export enum PieceSize {
	L,
	M,
	S
}

export class PieceSelectField extends g.E {

	private static readonly SLIDEIN_ANIM_WAIT: number = 200;

	private static readonly touchPosTbl: g.CommonOffset[][] = [
		[{ x: 0, y: 0 }],
		[{ x: -24, y: 50}, {x: 90, y: -6}],
		[{ x: 107, y: -10 }, { x: 107, y: 114 }, { x: -24, y: 100 }, {x: -24, y: -12} ]
	];

	get RemainNum(): number {
		return this.indexTable.length;
	}

	selectFrameIndex: number = -1;

	onSlideInFinish: Array<(frameIdx: number, pieceIndex: number) => void> = [];
	onTouchGetPiece: Array<(idx: number) => boolean> = [];

	private indexTable: number[] = [];
	private pieceTable: g.E[] = [];

	private pieceLayer: g.E = null;
	private touchLayer: g.E = null;

	private frameL: g.E = null;
	private frameM: g.E = null;
	private frameS: g.E[] = [];

	private selectFrame: g.Sprite[] = [];
	private pieceEntryIndex: number[] = [];

	private currentShowIndex: number = -1;

	private lastSelect: Array<{ frameIdx: number, pieceIdx: number}> = [];

	private requestCount: number = 0;

	constructor(s: g.Scene, pieceSize: PieceSize, pieces: g.E[]) {
		super({ scene: s });

		// 出す順番
		this.indexTable = Util.shuffle(Enumerable.range(0, pieces.length).toArray());
		this.pieceTable = pieces;

		this.pieceLayer = new g.E({ scene: s });
		this.append(this.pieceLayer);

		const tpTbl = PieceSelectField.touchPosTbl[pieceSize];
		this.touchLayer = new g.E({ scene: s });
		tpTbl.forEach(x => {
			const lfl = this.createSelectFrame(pieceSize);
			lfl.x = x.x;
			lfl.y = x.y;
			lfl.modified();
			this.selectFrame.push(lfl);
			this.touchLayer.append(lfl);
			this.pieceEntryIndex.push(-1);
		});
		const tf = this.initTouchLayers(this.touchLayer, this.selectFrame[0], tpTbl);
		const tf2sf: { [index: number]: number } = [];
		for (let i = 0; i < tf.length; ++i) {
			tf2sf[tf[i].id] = i;
		}

		this.append(this.touchLayer);
		tf.forEach((_tf, tfidx) => {
			_tf.pointDown.add(
				() => {
					this.selectFrame.forEach((x, idx) => {
						x.opacity = (tf2sf[_tf.id] === idx) ? 1 : 0;
						x.modified();
					});
				});
			_tf.pointUp.add(() => {
				let touchDisableRequest: boolean = false;
				const pieceIdx = this.pieceEntryIndex[tfidx];
				Global.instance.log("selectFrameIndex: " + this.selectFrameIndex + " => " + tfidx);
				this.selectFrameIndex = tfidx;
				this.pushSelect(tfidx, pieceIdx);
				this.onTouchGetPiece.forEach(x => touchDisableRequest = x(pieceIdx) || touchDisableRequest);

				this.touchLayer.children.forEach((e, i) => e.touchable = tfidx !== i);
			});

		});

		this.onSlideInFinish.push(
			(gi, idx) => {
				this.currentShowIndex = idx;
				tf.forEach(_tf => _tf.touchable = true);
			});

		let updateCnt = 0;
		this.update.add(
			() => {
				updateCnt++;
			});
	}

	get(num: number = 1) {
		const tl = new Timeline(this.scene);
		const layer = new g.E({ scene: this.scene });
		const index = this.indexTable.pop();

		const np = this.pieceTable[index];
		const getIndexTbl: number[] = [];

		this.pieceEntryIndex.forEach((v, i) => {
			if (v === -1) {
				getIndexTbl.push(i);
			}
		});
		const getIndex = getIndexTbl.pop();

		const frame = this.selectFrame[getIndex];

		const px = frame.x + ((frame.width - np.width) / 2);
		const py = frame.y + ((frame.height - np.height) / 2);

		this.pieceLayer.append(layer);
		layer.append(np);
		layer.x = px;
		layer.y = g.game.height + np.height;
		layer.modified();

		this.pieceEntryIndex[getIndex] = index;
		const time = PieceSelectField.SLIDEIN_ANIM_WAIT;

		tl.create(layer, { modified: layer.modified, destroyed: layer.destroyed })
			.moveTo(px, py, time, easeOutQuart)
			.con()
			.every(
				(e, p) => {
					if (p < 1) {
						return;
					}
					this.onSlideInFinish.forEach(x => x(getIndex, index));
					tl.destroy();
				},
				time
			);

		this.requestCount++;

		if (0 < getIndexTbl.length) {
			this.get();
		}
	}

	setNextSelectFrame() {
		this.selectFrame.forEach(x => {
			x.opacity = 0;
			x.modified();
		});
		this.pieceEntryIndex.some((x, idx) => {
			const sf = this.selectFrame[idx];
			if (x < 0) {
				return false;
			}
			sf.opacity = 1;
			sf.modified();
			Global.instance.log("setNextSelectFrame(" + x + ")");
			this.onTouchGetPiece.forEach(sx => sx(x));
			this.currentShowIndex = idx;
			this.selectFrameIndex = idx;
			return true;
		});
	}

	releaseSelectObject() {
		Global.instance.log("releaseSelectObject(" + this.selectFrameIndex + ")");
		this.pieceEntryIndex[this.selectFrameIndex] = -1;
	}

	private pushSelect(frameIdx: number, pieceIdx: number) {
		this.lastSelect.push({frameIdx: frameIdx, pieceIdx: pieceIdx});
	}

	private popSelect(): {frameIdx: number, pieceIdx: number} {
		return this.lastSelect.pop();
	}

	private clearSelect() {
		this.lastSelect = [];
	}

	private createSelectFrame(size: PieceSize): g.Sprite {
		let p = null;
		switch (size) {
			case PieceSize.L:
				p = SpriteFactory.createSelectFrameL(this.scene);
				break;
			case PieceSize.M:
				p = SpriteFactory.createSelectFrameM(this.scene);
				break;
			case PieceSize.S:
				p = SpriteFactory.createSelectFrameS(this.scene);
		}

		p.opacity = 0;
		p.modified();
		return p;
	}

	private selectFrameInit(r: g.E, f: g.Sprite) {

		f.x = -(f.width / 2);
		f.y = -(f.height / 2);
		f.modified();
		f.hide();
		r.append(f);

		r.width = f.width;
		r.height = f.height;
		r.modified();
		r.touchable = true;

		this.append(r);
	}

	private initTouchLayers(r: g.E, f: g.CommonSize, pos: g.CommonOffset[]): g.FilledRect[] {

		const touchFields: g.FilledRect[] = [];

		pos.forEach(p => {
			const tf = new g.FilledRect({
				scene: this.scene,
				width: f.width,
				height: f.height,
				cssColor: "#ff0000",
				opacity: Global.instance.DEBUG ? 0 : 0,
				x: p.x,
				y: p.y
			});

			r.append(tf);
			touchFields.push(tf);
		});

		return touchFields;
	}
}
