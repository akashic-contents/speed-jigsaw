export class Queue<T> {

	get IsEmpty(): boolean {
		return this.data.length < 1;
	}

	private data: T[] = [];

	constructor() {
		this.data = [];
	}

	push(v: T): void {
		this.data.push(v);
	}

	peek(): T {
		return this.data[0];
	}

	pop(): T {
		const r = this.peek();
		this.data.shift();
		return r;
	}
}
