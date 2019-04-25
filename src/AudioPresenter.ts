import { Global } from "./Global";

export class AudioPresenter {
	static instance: AudioPresenter;

	public static initialize(_s: g.Scene) {
		AudioPresenter.instance = new AudioPresenter(_s);
	}

	_s: g.Scene = null;
	bgmPlayer: g.AudioAsset = null;

	constructor(_scene: g.Scene) {
		this._s = _scene;
	}

	playBGM(name: string)  {
		if (Global.instance.muteSound) {
			return;
		}
		if (this.bgmPlayer !== null) {
			if (this.bgmPlayer.id === name) {
				return;
			} else {
				this.stopBGM();
			}
		}

		this.bgmPlayer = (this._s.assets[name] as g.AudioAsset);
		this.bgmPlayer.play();
	}

	stopBGM() {
		if (this.bgmPlayer === null) {
			return;
		}

		this.bgmPlayer.stop();
		this.bgmPlayer = null;
	}

	playJINGLE(name: string): g.AudioPlayer {
		if (Global.instance.muteSound) {
			return;
		}
		return (this._s.assets[name] as g.AudioAsset).play();
	}

	playSE(name: string): g.AudioPlayer {
		if (Global.instance.muteSound) {
			return;
		}
		return (this._s.assets[name] as g.AudioAsset).play();
	}
}
