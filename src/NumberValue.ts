import { Util } from "./Util";

export enum NumberType {
	W28,
	W72,
	Y28,
	R28
}

class FontInfo {
	glyphWidth: number = 0;
	glyphHeight: number = 0;
	map: string = "";
}

export class NumberFontData {
	label: g.Label = null;
	font: g.BitmapFont = null;

	constructor(f: g.BitmapFont, l: g.Label) {
		this.label = l;
		this.font = f;
	}

	destroy(): void {
		if (!this.label.destroyed()) {
			this.label.destroy();
		}
		if (!this.font.destroyed()) {
			this.font.destroy();
		}
	}
}

export class NumberFont {
	font28: g.BitmapFont;
	font72: g.BitmapFont;

	static generate(s: g.Scene, type: NumberType): NumberFontData {
		const fi = NumberFont.fontInfo[type];
		const f = new g.BitmapFont({
			src: s.asset.getImageById(NumberFont.IMAGE_NAME),
			map: Util.readJSON(s, fi.map),
			defaultGlyphWidth: fi.glyphWidth,
			defaultGlyphHeight: fi.glyphHeight
		});

		const l = new g.Label({
			scene: s,
			font: f,
			text: "",
			fontSize: fi.glyphWidth
		});
		return new NumberFontData(f, l);
	}

	private static IMAGE_NAME: string = "ui_common";
	private static _instance: NumberFont = null;

	private static fontInfo: FontInfo[] = [
		// w28
		{glyphWidth: 28, glyphHeight: 32, map: "glyph28"},
		{glyphWidth: 72, glyphHeight: 82, map: "glyph72"},
		{glyphWidth: 32, glyphHeight: 36, map: "glyph32_yellow"}
	];

	static get instance(): NumberFont {
		if (NumberFont._instance == null) {
			NumberFont._instance = new NumberFont();
		}
		return NumberFont._instance;
	}

	initialize(_s: g.Scene): void {
		this.font28 = new g.BitmapFont({
			src: _s.asset.getImageById(NumberFont.IMAGE_NAME),
			map: Util.readJSON(_s, "glyph28"),
			defaultGlyphWidth: 28,
			defaultGlyphHeight: 32
		});

		this.font72 = new g.BitmapFont({
			src: _s.asset.getImageById(NumberFont.IMAGE_NAME),
			map: Util.readJSON(_s, "glyph72"),
			defaultGlyphWidth: 72,
			defaultGlyphHeight: 82
		});
	}

	genelateLabel28(_s: g.Scene): g.Label {
		return new g.Label({
			scene: _s,
			font: this.font28,
			text: "",
			fontSize: 28
		});
	}

	genelateLabel72(_s: g.Scene): g.Label {
		return new g.Label({
			scene: _s,
			font: this.font72,
			text: "",
			fontSize: 72
		});
	}

	destroy(): void {
		if (!this.font28.destroyed()) {
			this.font28.destroy();
		}

		if (!this.font72.destroyed()) {
			this.font72.destroy();
		}
	}
}
