export const enum PossibleValue {
	Impossible = 0,
	Voltorb = 1 << 0,
	Coin1 = 1 << 1,
	Coin2 = 1 << 2,
	Coin3 = 1 << 3,
	All = Voltorb | Coin1 | Coin2 | Coin3,
}

export const enum SelectedValue {
	None = 0,
	Voltorb = 1,
	Coin0 = 1,
	Coin1 = 2,
	Coin2 = 3,
	Coin3 = 4,
}

export interface ValueInput {
	canChange: boolean;
	coins: number;
	volts: number;
}

export interface AnalyzeOutput {
	canSelect: boolean;
	selectedValue: SelectedValue;
	possibleValues: PossibleValue;
	readonly solvedValue: SelectedValue;
	solve(value: SelectedValue): void;
	/**listener */ onSelectChange: (value: SelectedValue) => void;
}

export interface AnalyzeTable {
	coinsRow(y: number): number;
	voltsRow(y: number): number;
	coinsCol(x: number): number;
	voltsCol(x: number): number;
	outputAt(x: number, y: number): AnalyzeOutput;

	lockInputs(): void;
	setFlag(x: number, y: number, flags: PossibleValue): void;
	solve(x: number, y: number, value: SelectedValue): void;
	/**listener */ onSelect: (x: number, y: number, value: number) => void;
	/**listener */ goFunc: () => void;
}

export interface Point {
	x: number;
	y: number;
}