import { Global } from "./Global";

export class OuterParamReceiver {

	static receiveParamFromMessage(s: g.Scene): void {
		s.onMessage.add((msg) => {
			if (msg.data && msg.data.type === "start") {
				if (msg.data.parameters) {
					if (msg.data.parameters.totalTimeLimit) {
						Global.instance.totalTimeLimit = msg.data.parameters.totalTimeLimit;
					}
					if (msg.data.parameters.difficulty) {
						Global.instance.difficulty = msg.data.parameters.difficulty;
					}
					if (msg.data.parameters.randomSeed) {
						Global.instance.random = new g.XorshiftRandomGenerator(msg.data.parameters.randomSeed);
					}
				}
			}
		});
	}

	static paramSetting(): void {
		g.game.vars.gameState = { score: 0, playThreshold: 1, clearThreshold: 0 };
	}

	static setGlobalScore(score: number): void {
		if (g.game.vars.gameState) {
			if (g.game.vars.gameState.score !== undefined) {
				g.game.vars.gameState.score = score;
			}
		}
	}

	static setClearThreashold(v: number): void {
		if (g.game.vars.gameState) {
			if (g.game.vars.gameState.clearThreshold !== undefined) {
				g.game.vars.gameState.clearThreshold = v;
			}
		}
	}
}
