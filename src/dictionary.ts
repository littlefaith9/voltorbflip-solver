import { noopFunc } from "./utils";

export class DictionaryItem {
	constructor(
		readonly level: number, // 1-8
		readonly x2s: number, // 0-8
		readonly x3s: number, // 0-7
		readonly vos: number,
	) {}
	get coins() {
		return 2 ** this.x2s * 3 ** this.x3s;
	}
}

export class DictionaryPage {
	readonly items: DictionaryItem[];
	onUpdated: () => void = noopFunc;
	constructor(items?: DictionaryItem[]) {
		this.items = items ?? [];
	}
	static clone(page: DictionaryPage) {
		return new this(page.items.slice());
	}
	filterByLevel(level: number) {
		for (let i = 0; i < this.items.length; i++) {
			if (this.items[i].level !== level) {
				this.items.splice(i--, 1);
			}
		}
		this.onUpdated();
	}
	filterByX2(x2s: number) {
		for (let i = 0; i < this.items.length; i++) {
			if (this.items[i].x2s < x2s) {
				console.log(this.items);
				this.items.splice(i--, 1);
			}
		}
		this.onUpdated();
	}
	filterByX3(x3s: number) {
		for (let i = 0; i < this.items.length; i++) {
			if (this.items[i].x3s < x3s) {
				this.items.splice(i--, 1);
			}
		}
		this.onUpdated();
	}
	get x2sMax() {
		return Math.max(...this.items.map(i => i.x2s));
	}
	get x3sMax() {
		return Math.max(...this.items.map(i => i.x3s));
	}
	get vosMax() {
		return Math.max(...this.items.map(i => i.vos))
	}
}

function getTotalMults(x2s: number, x3s: number, vos: number) {
	const x1 = 25 - (x2s + x3s + vos);
	return x1 + 2 * x2s + 3 * x3s;
}

export class Dictionary {
	readonly dict: { [mults: number]: { [voltorbs: number]: DictionaryPage } } = {};
	constructor() {
		// multsTotal-voltorbs
		this.addEntry(1, 0, 3, 6); // 25-06
		this.addEntry(1, 3, 1, 6); // 24-06
		this.addEntry(1, 2, 2, 6); // 25-06
		this.addEntry(1, 5, 0, 6); // 24-06
		this.addEntry(1, 4, 1, 6); // 25-06
		
		this.addEntry(2, 1, 3, 7); // 25-07
		this.addEntry(2, 0, 4, 7); // 26-07
		this.addEntry(2, 3, 2, 7); // 25-07
		this.addEntry(2, 6, 0, 7); // 24-07
		this.addEntry(2, 5, 1, 7); // 25-07
		
		this.addEntry(3, 2, 3, 8); // 25-08
		this.addEntry(3, 1, 4, 8); // 26-08
		this.addEntry(3, 4, 2, 8); // 25-08
		this.addEntry(3, 7, 0, 8); // 24-08
		this.addEntry(3, 6, 1, 8); // 25-08
		
		this.addEntry(4, 0, 5, 8); // 27-08
		this.addEntry(4, 3, 3, 8); // 26-08
		this.addEntry(4, 2, 4, 10); // 25-10
		this.addEntry(4, 5, 2, 10); // 24-10
		this.addEntry(4, 8, 0, 10); // 23-10
		
		this.addEntry(5, 1, 5, 10); // 26-10
		this.addEntry(5, 4, 3, 10); // 25-10
		this.addEntry(5, 7, 1, 10); // 24-10
		this.addEntry(5, 6, 2, 10); // 25-10
		this.addEntry(5, 9, 0, 10); // 24-10
		
		this.addEntry(6, 0, 6, 10); // 27-10
		this.addEntry(6, 3, 4, 10); // 26-10
		this.addEntry(6, 2, 5, 10); // 27-10
		this.addEntry(6, 5, 3, 10); // 26-10
		this.addEntry(6, 8, 1, 10); // 25-10
		
		this.addEntry(7, 4, 4, 10); // 27-10
		this.addEntry(7, 7, 2, 10); // 26-10
		this.addEntry(7, 6, 3, 10); // 27-10
		this.addEntry(7, 1, 6, 13); // 25-13
		this.addEntry(7, 9, 1, 13); // 23-13
		
		this.addEntry(8, 0, 7, 10); // 29-10
		this.addEntry(8, 2, 6, 10); // 29-10
		this.addEntry(8, 5, 4, 10); // 28-10
		this.addEntry(8, 8, 2, 10); // 27-10
		this.addEntry(8, 7, 3, 10); // 28-10
	}
	addEntry(level: number, x2s: number, x3s: number, voltorbs: number) {
		const collectionByMults = this.dict[getTotalMults(x2s, x3s, voltorbs)] ??= {};
		const collectionEntries = collectionByMults[voltorbs] ??= new DictionaryPage();
		collectionEntries.items.push(new DictionaryItem(level, x2s, x3s, voltorbs));
	}
	getPage(coinsTotal: number, voltorbs: number) {
		const page = this.dict[coinsTotal][voltorbs];
		if (page) {
			return page;
		}
		else {
			console.warn(`Page doesn't exist, coins: ${coinsTotal}, voltorbs: ${voltorbs}`);
			return new DictionaryPage();
		}
	}
	freeze() {
		Object.values(Object.freeze(this.dict))
			.forEach(v => Object.values(Object.freeze(v))
				.forEach(v => Object.freeze(v.items)));
	}
}
