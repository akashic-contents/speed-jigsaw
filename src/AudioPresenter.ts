import { Global } from "./Global";

export class AudioPresenter {
	static instance: AudioPresenter;

	_s: g.Scene = null;
	bgmPlayer: g.AudioAsset = null;

	public static initialize(_s: g.Scene): void {
		AudioPresenter.instance = new AudioPresenter(_s);
	}

	constructor(_scene: g.Scene) {
		this._s = _scene;
	}

	playBGM(name: string): void  {
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

		this.bgmPlayer = this._s.asset.getAudioById(name);
		this.bgmPlayer.play();
	}

	stopBGM(): void {
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
		return this._s.asset.getAudioById(name).play();
	}

	playSE(name: string): g.AudioPlayer {
		if (Global.instance.muteSound) {
			return;
		}
		return this._s.asset.getAudioById(name).play();
	}
}
