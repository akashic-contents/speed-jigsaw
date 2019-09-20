import { Global } from "./Global";

export class Util {
	static shuffle<T>(array: T[]): T[] {
		const length = array == null ? 0 : array.length;
		if (!length) {
			return [];
		}
		if (length === 1) {
			return array.slice(0);
		}
		let index = -1;
		const lastIndex = length - 1;
		let result: T[] = [];
		result = array.slice(0);

		while (++index < length) {
			const rand = index + (Global.instance.random.get(0, (lastIndex - index)) | 0);
			const value = result[rand];
			result[rand] = result[index];
			result[index] = value;
		}
		return result;
	}

	static readJSON(_s: g.Scene, name: string): any {
		return JSON.parse((_s.assets[name] as g.TextAsset).data);
	}

	static lerp(a: number, b: number, t: number, matchThreshold: number = 0) {
		let r = (1 - t) * a + t * b;
		if (0 < matchThreshold) {
			if (Math.abs(r - a) < matchThreshold) {
				r = b;
			}
		}

		return r;
	}

	static getWorldPos(r: g.E, px: number = 0, py: number = 0): g.CommonArea {
		let rt = r;
		let mx = new g.PlainMatrix();
		mx.reset(px, py);
		do {
			const cx = rt.getMatrix();
			mx = cx.multiplyNew(mx);
			rt = rt.parent as g.E;
		} while (rt instanceof g.E);
		const ofs = mx.multiplyPoint({x: 0, y: 0});
		return {x: ofs.x, y: ofs.y, width: r.width, height: r.height};
	}

	static range(start: number, count: number, step: number = 1): number[] {
		const result: number[] = [];
		for (let i = 0; i < count; i++) {
			result.push(start + i * step);
		}
		return result;
	}

	static repeat<T>(obj: T, count: number): T[] {
		const result: T[] = [];
		for (let i = 0; i < count; i++) {
			result.push(obj);
		}
		return result;
	}
}
