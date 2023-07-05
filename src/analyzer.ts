import type { Dictionary, DictionaryPage } from "./dictionary";
import { AnalyzeTable, DictionaryTable, Point, PossibleValue, SelectedValue } from "./interfaces";

export class Analyzer {
	private currentDictPage!: DictionaryPage;
	private x2s = 0;
	private x3s = 0;
	private vos = 0;
	constructor (
		private readonly dict: Dictionary,
		private readonly analyzeTable: AnalyzeTable,
		private readonly dictionaryTable: DictionaryTable,
	) {
		analyzeTable.goFunc = () => this.start();
		analyzeTable.onSelect = (x, y, v) => this.updateFlagsCross(x, y, this.ensureSelection(x, y, v));
	}
	start() {
		this.analyzeTable.lockInputs();
		this.changeDictPage();
		this.updateFlagsInitial();
	}
	private changeDictPage() {
		const coinsTotal = [0, 1, 2, 3, 4]
			.map(y => this.analyzeTable.coinsRow(y))
			.reduce((prev, cur) => prev + cur);
		const voltsTotal = [0, 1, 2, 3, 4]
			.map(y => this.analyzeTable.voltsRow(y))
			.reduce((prev, cur) => prev + cur);
		this.currentDictPage = this.dict.getPage(coinsTotal, voltsTotal);
		this.dictionaryTable.setPage(this.currentDictPage);
	}
	private getIndices(value: PossibleValue) {
		const result: number[] = [];
		if (value & PossibleValue.Voltorb) {
			result.push(SelectedValue.Voltorb);
		}
		if (value & PossibleValue.Coin1) {
			result.push(SelectedValue.Coin1);
		}
		if (value & PossibleValue.Coin2) {
			result.push(SelectedValue.Coin2);
		}
		if (value & PossibleValue.Coin3) {
			result.push(SelectedValue.Coin3);
		}
		return result;
	}
	private getFlags(values: SelectedValue[]) {
		let result = PossibleValue.Impossible;
		for (const value of values) {
			switch (value) {
				case SelectedValue.Voltorb:
					result |= PossibleValue.Voltorb;
					break;
				case SelectedValue.Coin1:
					result |= PossibleValue.Coin1;
					break;
				case SelectedValue.Coin2:
					result |= PossibleValue.Coin2;
					break;
				case SelectedValue.Coin3:
					result |= PossibleValue.Coin3;
					break;
			}
		}
		return result;
	}
	private getPossibleFlags(unsolved: number, coins: number, volts: number) {
		let flags = PossibleValue.Impossible;
		if (this.vos < this.currentDictPage.vosMax && volts) {
			flags |= PossibleValue.Voltorb;
		}
		const rp = coins;
		const rv = volts;
		if (rp) {
			if (this.x3s < this.currentDictPage.x3sMax && rp + rv >= unsolved + 2 && rp + rv * 3 <= unsolved * 3 - 0) {
				flags |= PossibleValue.Coin3;
			}
			if (this.x2s < this.currentDictPage.x2sMax && rp + rv >= unsolved + 1 && rp + rv * 3 <= unsolved * 3 - 1) {
				flags |= PossibleValue.Coin2;
			}
			if (rp + rv >= unsolved + 0 && rp + rv * 3 <= unsolved * 3 - 2) {
				flags |= PossibleValue.Coin1;
			}
		}
		return flags;
	}
	private checkFlagsAndSolve(x: number, y: number, flags: PossibleValue, solvedCollection?: Point[]) {
		const indices = this.getIndices(flags);

		if (indices.length === 1) {
			this.analyzeTable.solve(x, y, indices[0]);
			switch (indices[0]) {
				case SelectedValue.Coin2:
					this.currentDictPage.filterByX2(++this.x2s);
					break;
				case SelectedValue.Coin3:
					this.currentDictPage.filterByX3(++this.x3s);
					break;
				case SelectedValue.Voltorb:
					this.vos++;
					break;
			}
			solvedCollection?.push({ x, y });
		}
		if (indices.length === 0) {
			throw new Error('Impossible initial value, check your input');
		}
	}
	// TODO: disable this at test mode
	private ensureSelection(px: number, py: number, value: SelectedValue) {
		this.checkFlagsAndSolve(px, py, this.getFlags([value]), { push: (p: Point) => this.updateFlagsCross(p.x, p.y, 0) } as any);
		return value;
	}
	updateFlagsCross(px: number, py: number, _value: SelectedValue) {
		const coinLeft = { row: this.analyzeTable.coinsRow(py), col: this.analyzeTable.coinsCol(px) };
		const voltLeft = { row: this.analyzeTable.voltsRow(py), col: this.analyzeTable.voltsCol(px) };

		const rowToUpdate = new Set([0, 1, 2, 3, 4]);
		const colToUpdate = new Set([0, 1, 2, 3, 4]);
		// colToUpdate.delete(py);

		const countIn = (key: 'row' | 'col', value: SelectedValue) => {
			if (value === SelectedValue.Voltorb) {
				voltLeft[key] -= 1;
				return true;
			}
			if (value > SelectedValue.Coin0) {
				coinLeft[key] -= value - SelectedValue.Coin0;
				return true;
			}
			return false;
		}
		for (const x of rowToUpdate.keys()) {
			const output = this.analyzeTable.outputAt(x, py);
			if (countIn('row', output.selectedValue) || countIn('row', output.solvedValue)) {
				rowToUpdate.delete(x);
			}
		}
		for (const y of colToUpdate.keys()) {
			const output = this.analyzeTable.outputAt(px, y);
			if (countIn('col', output.selectedValue) || countIn('col', output.solvedValue)) {
				colToUpdate.delete(y);
			}
		}

		const possibleValuesRow = this.getPossibleFlags(rowToUpdate.size, coinLeft.row, voltLeft.row);
		const possibleValuesCol = this.getPossibleFlags(colToUpdate.size, coinLeft.col, voltLeft.col);

		const solved: Point[] = [];
		for (const x of rowToUpdate.keys()) {
			const output = this.analyzeTable.outputAt(x, py);
			const flags = output.possibleValues & possibleValuesRow;
			this.analyzeTable.setFlag(x, py, flags);
			this.checkFlagsAndSolve(x, py, flags, solved);
		}
		for (const y of colToUpdate.keys()) {
			const output = this.analyzeTable.outputAt(px, y);
			const flags = output.possibleValues & possibleValuesCol;
			this.analyzeTable.setFlag(px, y, flags);
			this.checkFlagsAndSolve(px, y, flags, solved);
		}
		for (const item of solved) {
			this.updateFlagsCross(item.x, item.y, 0);
		}
	}
	updateFlagsInitial() {
		const solved: Point[] = [];
		for (let y = 0; y < 5; y++) {
			const rowCoins = this.analyzeTable.coinsRow(y);
			const rowVolts = this.analyzeTable.voltsRow(y);
			for (let x = 0; x < 5; x++) {
				const colCoins = this.analyzeTable.coinsCol(x);
				const colVolts = this.analyzeTable.voltsCol(x);

				const rowFlags = this.getPossibleFlags(5, rowCoins, rowVolts);
				const colFlags = this.getPossibleFlags(5, colCoins, colVolts);
				const flags = rowFlags & colFlags;
				this.analyzeTable.setFlag(x, y, flags);
				this.checkFlagsAndSolve(x, y, flags, solved);
			}
		}
		for (const item of solved) {
			this.updateFlagsCross(item.x, item.y, 0);
		}
	}
}