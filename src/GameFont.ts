export class GameFont {
	static instance: GameFont = new GameFont();

	private fontSize: number = 34;
	private _s: g.Scene;
	private font: g.DynamicFont = null;
	private boldFont: g.DynamicFont = null;

	initialize(_s: g.Scene): void {
		const _f = this.createFont(this.fontSize);
		this.font = _f;
		const _bf = this.createFont(this.fontSize, true);
		this.boldFont = _bf;
		this._s = _s;
	}

	generateLabel(col: string, isBold: boolean = false): g.Label {
		return this.generateLabelWithSize(this.font.size, col, isBold);
	}

	generateLabelWithSize(size: number, col: string, isBold: boolean = false): g.Label {

		const useFont: g.Font = isBold ? this.boldFont : this.font;

		return new g.Label({
			scene: this._s,
			font: useFont,
			text: "",
			fontSize: size,
			textColor: col,
			touchable: true,

			x: this.font.size / 2,
			y: -(this.font.size / 2)
		});
	}

	private createFont(_size: number, isBold: boolean = false): g.DynamicFont {

		const weight: g.FontWeightString = isBold ? "bold" : "normal";

		return new g.DynamicFont({
			game: g.game,
			fontFamily: "sans-serif",
			size: _size,
			fontWeight: weight
		});
	}
}
