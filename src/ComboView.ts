import { SpriteFactory } from "./SpriteFactory";
import { NumberFont, NumberType } from "./NumberValue";

export class ComboView extends g.E {

	private static readonly NUM_OFFSET_X: number = 152;
	private static readonly NUM_OFFSET_Y: number = 1;

	set Value(v: number) {
		this.label.text = (v | 0).toString();
		this.label.invalidate();

		const n = this.label.text.length - 1;

		this.label.x = ComboView.NUM_OFFSET_X - (n * this.label.fontSize);
		this.label.y = ComboView.NUM_OFFSET_Y;
		this.label.modified();
	}

	private label: g.Label = null;

	constructor(s: g.Scene, v: number = 0) {
		super({scene: s});

		const base = SpriteFactory.createComboYellowBase(s);
		this.append(base);

		const info = NumberFont.generate(s, NumberType.Y28);
		this.label = info.label;
		this.label.fontSize = 36;
		this.label.invalidate();
		this.append(this.label);
		this.Value = v;
	}

}
