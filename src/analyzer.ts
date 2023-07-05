import { AnalyzeTable, Point, PossibleValue, SelectedValue } from "./sheetInterfaces";

export class Analyzer {
	readonly coinsLeftRow = new Uint8Array(5);
	readonly coinsLeftCol = new Uint8Array(5);
	readonly voltsLeftRow = new Uint8Array(5);
	readonly voltsLeftCol = new Uint8Array(5);
	constructor (private readonly table: AnalyzeTable) {}
	start() {
		this.table.lockInputs();
		this.updateFlagsInitial();
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
	// private getFlags(values: SelectedValue[]) {
	// 	let result = PossibleValue.Impossible;
	// 	for (const value of values) {
	// 		switch (value) {
	// 			case SelectedValue.Voltorb:
	// 				result |= PossibleValue.Voltorb;
	// 				break;
	// 			case SelectedValue.Coin1:
	// 				result |= PossibleValue.Voltorb;
	// 				break;
	// 			case SelectedValue.Coin2:
	// 				result |= PossibleValue.Voltorb;
	// 				break;
	// 			case SelectedValue.Coin3:
	// 				result |= PossibleValue.Voltorb;
	// 				break;
	// 		}
	// 	}
	// 	return result;
	// }
	private getPossibleFlags(unsolved: number, coins: number, volts: number) {
		let flags = PossibleValue.Impossible;
		if (volts) {
			flags |= PossibleValue.Voltorb;
		}
		const rp = coins;
		const rv = volts;
		if (rp) {
			if (rp + rv >= unsolved + 2 && rp + rv * 3 <= unsolved * 3 - 0) {
				flags |= PossibleValue.Coin3;
			}
			if (rp + rv >= unsolved + 1 && rp + rv * 3 <= unsolved * 3 - 1) {
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
			this.table.solve(x, y, indices[0]);
			solvedCollection?.push({ x, y });
		}
		if (indices.length === 0) {
			throw new Error('Impossible initial value, check your input');
		}

		console.log('processing', x, y, flags);
	}
	updateFlagsCross(px: number, py: number, _value: SelectedValue) {
		const coinLeft = { row: this.table.coinsRow(py), col: this.table.coinsCol(px) };
		const voltLeft = { row: this.table.voltsRow(py), col: this.table.voltsCol(px) };

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
			const output = this.table.outputAt(x, py);
			if (countIn('row', output.selectedValue) || countIn('row', output.solvedValue)) {
				rowToUpdate.delete(x);
			}
		}
		for (const y of colToUpdate.keys()) {
			const output = this.table.outputAt(px, y);
			if (countIn('col', output.selectedValue) || countIn('col', output.solvedValue)) {
				colToUpdate.delete(y);
			}
		}

		const possibleValuesRow = this.getPossibleFlags(rowToUpdate.size, coinLeft.row, voltLeft.row);
		const possibleValuesCol = this.getPossibleFlags(colToUpdate.size, coinLeft.col, voltLeft.col);

		const solved: Point[] = [];
		for (const x of rowToUpdate.keys()) {
			const output = this.table.outputAt(x, py);
			const flags = output.possibleValues & possibleValuesRow;
			this.table.setFlag(x, py, flags);
			this.checkFlagsAndSolve(x, py, flags, solved);
		}
		for (const y of colToUpdate.keys()) {
			const output = this.table.outputAt(px, y);
			const flags = output.possibleValues & possibleValuesCol;
			this.table.setFlag(px, y, flags);
			this.checkFlagsAndSolve(px, y, flags, solved);
		}
		for (const item of solved) {
			this.updateFlagsCross(item.x, item.y, 0);
		}
	}
	updateFlagsInitial() {
		const solved: Point[] = [];
		for (let y = 0; y < 5; y++) {
			const rowCoins = this.table.coinsRow(y);
			const rowVolts = this.table.voltsRow(y);
			for (let x = 0; x < 5; x++) {
				const colCoins = this.table.coinsCol(x);
				const colVolts = this.table.voltsCol(x);

				const rowFlags = this.getPossibleFlags(5, rowCoins, rowVolts);
				const colFlags = this.getPossibleFlags(5, colCoins, colVolts);
				const flags = rowFlags & colFlags;
				this.table.setFlag(x, y, flags);
				this.checkFlagsAndSolve(x, y, flags, solved);
			}
		}
		for (const item of solved) {
			this.updateFlagsCross(item.x, item.y, 0);
		}
	}
}