import { SpriteFactory } from "./SpriteFactory";
import { NumberFont } from "./NumberValue";

export class RemainPieceView extends g.E {

	private static readonly LABEL_X: number = 96;
	private static readonly LABEL_Y: number = 18;

	set Num(v: number) {
		const l = this.label;
		l.text = (v | 0).toString();
		l.invalidate();

		l.x = RemainPieceView.LABEL_X - ((l.text.length - 1) * l.fontSize);
		l.y = RemainPieceView.LABEL_Y;
		l.modified();
	}

	private label: g.Label;

	constructor(s: g.Scene, num: number = 0) {
		super({scene: s});

		const frm = SpriteFactory.createRemainPieceFrame(s);
		this.append(frm);

		const l = NumberFont.instance.genelateLabel28(s);
		this.append(l);
		this.label = l;
		this.Num = num;
	}
}
