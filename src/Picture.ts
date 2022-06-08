import { Global } from "./Global";
import { PieceSize } from "./PieceSelectField";
import { SpriteFactory } from "./SpriteFactory";
import { Util } from "./Util";

export enum MaskDir {
	NONE = 0,
	UP = 1,
	RIGHT = 2,
	DOWN = 4,
	LEFT = 8
}

export class Picture extends g.E {

	static readonly IMAGE_PIX: number = 253;
	private static readonly IMAGE_NAME: string = "ui_2";

	get Pieces(): g.E[] {
		return this.parts;
	}

	get Image(): g.Sprite {
		return this.image;
	}

	get getLines(): g.E {
		return this.linesEntity;
	}

	private image: g.Sprite = null;
	private parts: g.E[] = [];
	private linesEntity: g.E = null;

	constructor(s: g.Scene, imageId: number, divX: number, divY: number) {
		super({scene: s});

		const imgs = this.createImage(Picture.IMAGE_NAME, imageId, divX, divY);
		this.image = imgs.image;
		this.parts = imgs.div;

		this.linesEntity = new g.E({scene: s});
		imgs.lines.forEach(l => this.linesEntity.append(l));

		this.append(this.linesEntity);
		this.append(this.image);
	}

	createImage(imageName: string, imageId: number, divX: number, divY: number): {image: g.Sprite; div: g.E[]; lines: g.Sprite[]} {
		const s = this.scene;

		const sx: number = 1 + ((imageId % 3) * Picture.IMAGE_PIX);
		const sy: number = 1 + (((imageId / 3) | 0) * Picture.IMAGE_PIX);

		Global.instance.log("createImage(" + sx + "," + sy + ")");

		const img = new g.Sprite({
			scene: s,
			src: s.asset.getImageById(imageName),

			srcX: sx,
			srcY: sy,

			width: Picture.IMAGE_PIX,
			height: Picture.IMAGE_PIX,
			srcWidth: Picture.IMAGE_PIX,
			srcHeight: Picture.IMAGE_PIX
		});

		const dw = (img.width / divX) | 0;
		const dh = (img.height / divY) | 0;

		let psize = PieceSize.L;
		switch (divX) { // FIXME: ちょっと雑
			case 3:
				psize = PieceSize.M;
				break;
			case 4:
				psize = PieceSize.S;
				break;
		}

		// 全部作って
		const dtbl: number[] = [];
		for (let y = 0; y < divY; ++y) {
			for (let x = 0; x < divX; ++x) {
				dtbl.push(this.getConvexAndDepressData(x, y, {width: divX, height: divY}));
			}
		}

		const ctbl: number[] = Util.repeat(0, dtbl.length);
		Util.shuffle(Util.range(0, dtbl.length)).forEach((idx) => {
			const neigbars = this.getPiecesNeighborsIndex(idx, divX, divY);
			let depress = dtbl[idx];
			let convex = 0;
			neigbars.forEach((v, i) => {
				const dir = [MaskDir.UP, MaskDir.RIGHT, MaskDir.DOWN, MaskDir.LEFT];
				const rev = [MaskDir.DOWN, MaskDir.LEFT, MaskDir.UP, MaskDir.RIGHT];
				if (v === -1) {
					return;
				}

				if ((dtbl[v] & rev[i]) === 0) {
					return;
				}

				depress &= ~dir[i];
				convex |= dir[i];
			});
			dtbl[idx] = depress;
			ctbl[idx] = convex;
		});

		// 誤差を取る
		const divImages: g.E[] = [];
		for (let y = 0; y < divY; ++y) {
			for (let x = 0; x < divX; ++x) {
				const idx = x + (y * divX);
				let dspr = null;
				const finfo = {x: sx + (x * dw), y: sy + (y * dh), width: dw, height: dh};
				dspr = this.createDepressPiece(imageName, finfo, psize, dtbl[idx]);
				dspr = this.createConvexPiece(imageName, finfo, dspr, psize, ctbl[idx]);
				divImages.push(dspr);
			}
		}

		// convexを元に下地を作る
		const lines: g.Sprite[] = [];
		for (let i = 0, max = (ctbl.length); i < max; ++i) {
			const px = i % divX;
			const py = (i / divX) | 0;
			const convex = ctbl[i];
			const sprT = this.getConvexLineTbl(psize);
			[MaskDir.UP, MaskDir.RIGHT, MaskDir.DOWN, MaskDir.LEFT].forEach((x, idx) => {
				if ((convex & x) === 0) {
					return;
				}
				let offsetX = 0;
				let offsetY = 0;
				const lspr = sprT[idx];

				if (x === MaskDir.RIGHT) {
					offsetX = (dw - (lspr.width / 2)) | 0;
				} else if (x === MaskDir.LEFT) {
					offsetX = -((lspr.width / 2) | 0);
				}

				if (x === MaskDir.UP) {
					offsetY = -((lspr.height / 2) | 0);
				} else if (x === MaskDir.DOWN) {
					offsetY = dh - ((lspr.height / 2) | 0);
				}

				lspr.x = (px * dw) + offsetX;
				lspr.y = (py * dh) + offsetY;
				lspr.modified();
				lines.push(lspr);
			});
		}

		return {image: img, div: divImages, lines: lines};
	}

	private getPiecesNeighborsIndex(pidx: number, w: number, h: number): number[] {
		let upPiece = -1;
		let rightPiece = -1;
		let downPiece = -1;
		let leftPiece = -1;

		const x = (pidx % w);
		const y = (pidx / w) | 0;

		const idx = x + (y * w);
		const right = (x + 1) < w;
		const left = 0 <= (x - 1);
		const up = 0 <= (y - 1);
		const down = (y + 1) < h;

		if (right) {
			rightPiece = idx + 1;
		}
		if (left) {
			leftPiece = idx - 1;
		}
		if (up) {
			upPiece = idx - w;
		}
		if (down) {
			downPiece = idx + w;
		}

		return [upPiece, rightPiece, downPiece, leftPiece];
	}

	private createConvexPiece(assetName: string, info: g.CommonArea, piece: g.E, pieceSize: PieceSize, convex: number = 0): g.E {
		const s = this.scene;
		// convex == 1248 => 上右下左
		const maskP = this.getMaskPieceTbl(pieceSize);
		const earTbl: g.CommonArea[] = [
			{x: info.x, y: info.y - maskP[0].height, width: info.width, height: maskP[0].height},
			{x: info.x + info.width, y: info.y, width: maskP[0].width, height: info.height},
			{x: info.x, y: info.y + info.height, width: info.width, height: maskP[0].height},
			{x: info.x - maskP[0].width, y: info.y, width: maskP[0].width, height: info.height}
		];
		const earPTbl: g.CommonOffset[] = [
			{ x: ((info.width - maskP[0].width) / 2) | 0, y: 0 },
			{ x: 0, y: ((info.height - maskP[0].height) / 2) | 0 },
			{ x: ((info.width - maskP[0].width) / 2) | 0, y: 0 },
			{ x: 0, y: ((info.height - maskP[0].height) / 2) | 0 }
		];
		const rootE = new g.E({scene: this.scene});

		// piece元作成

		rootE.append(piece);

		[MaskDir.UP, MaskDir.RIGHT, MaskDir.DOWN, MaskDir.LEFT].forEach((x, i) => {
			if ((convex & x) === 0) {
				return;
			}
			const et = earTbl[i];

			// 抜き用ノリシロ作成
			const ear = new g.Sprite({
				scene: s,
				src: s.asset.getImageById(assetName),
				srcX: et.x,
				srcY: et.y,
				srcWidth: et.width,
				srcHeight: et.height,

				width: et.width,
				height: et.height
			});

			const mergeE = new g.E({scene: s});

			maskP[i].x = earPTbl[i].x;
			maskP[i].y = earPTbl[i].y;
			maskP[i].modified();

			// maskPとノリシロをmerge
			ear.compositeOperation =  "source-atop";
			ear.modified();
			mergeE.append(maskP[i]);
			mergeE.append(ear);
			// createspritefromeでnewノリシロ作成
			const newEar = g.SpriteFactory.createSpriteFromE(s, mergeE);
			// createspritefromeでpiece + ノリシロ作成
			newEar.x = et.x - info.x;
			newEar.y = et.y - info.y;
			newEar.modified();

			rootE.append(newEar);
		});

		const pieceSprite = g.SpriteFactory.createSpriteFromE(s, rootE);
		const se = new g.E({scene: s});
		let pw = 0;
		let ph = 0;
		if ((convex & MaskDir.UP) !== 0) {
			se.y += maskP[0].height;
			ph += maskP[0].height;
		}
		if ((convex & MaskDir.DOWN) !== 0) {
			ph += maskP[0].height;
		}
		if ((convex & MaskDir.LEFT) !== 0) {
			se.x += maskP[0].width;
			pw += maskP[0].width;
		}
		if ((convex & MaskDir.RIGHT) !== 0) {
			pw += maskP[0].width;
		}
		pieceSprite.modified();
		rootE.destroy();

		se.append(pieceSprite);
		se.width = piece.width + pw;
		se.height = piece.height + ph;
		se.modified();

		return se;
	}

	private createDepressPiece(assetName: string, info: g.CommonArea, psize: PieceSize, depress: number = 0): g.E {
		const s = this.scene;
		const maskP = this.getMaskPieceTbl(psize);
		const holeTbl: g.CommonOffset[] = [
			{x: ((info.width - maskP[0].width) / 2) | 0, y: 0},
			{x: info.width - maskP[0].width, y: ((info.height - maskP[0].height) / 2) | 0},
			{x : ((info.width - maskP[0].width) / 2) | 0, y: (info.height - maskP[0].height)},
			{x : 0, y: ((info.height - maskP[0].height) / 2) | 0}
		];

		// piece元作成
		let piece = new g.Sprite({
			scene: s,
			src: s.asset.getImageById(assetName),
			srcX: info.x,
			srcY: info.y,

			width: info.width,
			height: info.height,
			srcWidth: info.width,
			srcHeight: info.height
		});

		[MaskDir.UP, MaskDir.RIGHT, MaskDir.DOWN, MaskDir.LEFT].forEach((x, i) => {
			const maskpi = (i + 2) % 4;
			if ((depress & x) === 0) {
				return;
			}

			const mergeE = new g.E({scene: s});

			const mp = maskP[maskpi]; // g.Util.createSpriteFromE(s, mpe);
			mp.x = holeTbl[i].x;
			mp.y = holeTbl[i].y;
			mp.modified();

			mp.compositeOperation = "xor";
			mp.modified();

			mergeE.append(piece);
			mergeE.append(mp);
			mergeE.width = piece.width;
			mergeE.height = piece.height;
			mergeE.modified();

			piece = g.SpriteFactory.createSpriteFromE(s, mergeE);
		});

		const se = new g.E({scene: s});
		se.append(piece);
		se.width = piece.width;
		se.height = piece.height;
		se.modified();

		return se;
	}

	private getMaskPieceTbl(size: PieceSize): g.Sprite[] {
		let tbl: g.Sprite[] = [];
		switch (size) {
			case PieceSize.L:
				tbl = SpriteFactory.createMaskL(this.scene);
				break;
			case PieceSize.M:
				tbl = SpriteFactory.createMaskM(this.scene);
				break;
			case PieceSize.S:
				tbl = SpriteFactory.createMaskS(this.scene);
				break;
			default:
				throw new Error("unknown size: " + size);
		}
		return tbl;
	}

	private getConvexLineTbl(size: PieceSize): g.Sprite[] {
		let tbl: g.Sprite[] = [];
		switch (size) {
			case PieceSize.L:
				tbl = SpriteFactory.createGuideL(this.scene);
				break;
			case PieceSize.M:
				tbl = SpriteFactory.createGuideM(this.scene);
				break;
			case PieceSize.S:
				tbl = SpriteFactory.createGuideS(this.scene);
				break;
			default:
				throw new Error("unknown size: " + size);
		}

		return tbl;
	}

	private getConvexAndDepressData(px: number, py: number, field: g.CommonSize): number {
		let maskDirT = [MaskDir.UP, MaskDir.RIGHT, MaskDir.DOWN, MaskDir.LEFT];

		if (px < 1) {
			// 左には付かない
			maskDirT = maskDirT.filter(n => n !== MaskDir.LEFT);
		}
		if ((field.width - 1) <= px) {
			// 右には付かない
			maskDirT = maskDirT.filter(n => n !== MaskDir.RIGHT);
		}

		if (py < 1) {
			// 上には付かない
			maskDirT = maskDirT.filter(n => n !== MaskDir.UP);
		}
		if ((field.height - 1) <= py) {
			// 下には付かない
			maskDirT = maskDirT.filter(n => n !== MaskDir.DOWN);
		}

		let data = 0;
		maskDirT.forEach(x => data |= x);

		return data;
	}
}
