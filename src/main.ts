import { FieldScene } from "./FieldScene";
import { TitleScene } from "./TitleScene";
import { ManualScene } from "./ManualScene";
import { ResultScene } from "./ResultScene";
import { Global } from "./Global";
import { AudioPresenter } from "./AudioPresenter";
import { NumberFont } from "./NumberValue";
import { OuterParamReceiver } from "./OuterParamReceiver";
import { GameFont } from "./GameFont";
import { SpriteFactory } from "./SpriteFactory";
import { GameField } from "./GameField";

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({game: g.game, assetIds: [
		"ui_common", "ui", "ui_2",
		"glyph28", "glyph72", "glyph32_yellow",
		"bgm_130",
		"jin_000", "jin_002",
		"se_005A_mono", "se_006B_mono",
		"se_001a", "se_001c", "se_002c", "se_003", "se_004",
		"se_100c"
	]});
	Global.init();

	OuterParamReceiver.receiveParamFromMessage(scene);
	OuterParamReceiver.paramSetting();

	scene.loaded.add(() => {
		AudioPresenter.initialize(scene);
		NumberFont.instance.initialize(scene);
		GameFont.instance.initialize(scene);

		const title = new TitleScene(scene);
		const manual = new ManualScene(scene);
		const field = new FieldScene(scene);
		const result = new ResultScene(scene);
		title.finishCallback.push(() => {
			title.dispose();
			manual.activate(scene);
		});

		manual.finishCallback.push(() => {
			manual.dispose();
			field.activate(scene);
		});

		field.finishCallback.push(() => {
			field.dispose();
			result.activate(scene);
		});

		result.finishCallback.push(() => {
			result.dispose();
			title.activate(scene);
		});

		if (Global.instance.DEBUG) {
			field.activate(scene);
		} else {
			title.activate(scene);
		}

	});
	g.game.pushScene(scene);
}

export = main;
