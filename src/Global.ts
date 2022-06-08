export class Global {

	static instance: Global;

	/**
	 * ゲームプレイの点数
	 */
	score: number;

	/**
	 * ゲームプレイ可能時間
	 */
	totalTimeLimit: number;

	/**
	 * 音の再生/非再生
	 */
	muteSound: boolean;

	/**
	 * 難易度の初期値
	 */
	difficulty: number;

	/**
	 * random生成器
	 */
	random: g.RandomGenerator;

	/**
	 * debug...
	 */
	DEBUG: boolean;

	static init(): void {
		Global.instance = new Global();
	}

	constructor() {
		this.score = 0;
		this.totalTimeLimit = 82;
		this.muteSound = false;
		this.difficulty = 1;
		this.random = g.game.random;
		this.DEBUG = false;

	}

	log(l: string): void {
		if (this.DEBUG) {
			console.log(l);
		}
	}
}
