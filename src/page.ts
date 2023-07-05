import { AnalyzeOutput, AnalyzeTable, ValueInput, PossibleValue, SelectedValue } from "./sheetInterfaces";
import { clamp, noopFunc } from "./utils";

class InputCell implements ValueInput {
	readonly cellType = 'input';
	private readonly element = document.createElement('td');
	private readonly inputCoins = document.createElement('input');
	private readonly inputVolts = document.createElement('input');
	private canChangeInternal = true;
	onEnterPressed = noopFunc;
	constructor(parent: HTMLElement) {
		this.inputCoins.type = 'number';
		this.inputCoins.value = '0';
		this.inputCoins.min = '0';
		this.inputCoins.max = '15';
		this.inputCoins.addEventListener('keydown', ev => {
			if (ev.key === 'Enter') {
				this.inputCoins.value = clamp(this.coins, 0, 15).toString();
				this.inputCoins.blur();
				this.inputVolts.select();
			}
		});

		this.inputVolts.type = 'number';
		this.inputVolts.value = '0';
		this.inputVolts.min = '0';
		this.inputVolts.max = '5';
		this.inputVolts.addEventListener('keydown', ev => {
			if (ev.key === 'Enter') {
				this.inputVolts.value = clamp(this.volts, 0, 5).toString();
				this.inputVolts.blur();
				this.onEnterPressed();
			}
		});

		this.element.append(this.inputCoins, this.inputVolts);
		parent.appendChild(this.element);
	}
	focus() {
		this.inputCoins.select();
	}
	get coins() {
		return parseInt(this.inputCoins.value) || 0;
	}
	get volts() {
		return parseInt(this.inputVolts.value) || 0;
	}
	get canChange() {
		return this.canChangeInternal;
	}
	set canChange(value) {
		this.inputCoins.disabled = !value;
		this.inputVolts.disabled = !value;
		this.canChangeInternal = value;
	}
}

class AnalyzeCell implements AnalyzeOutput {
	readonly cellType = 'analyze';
	private readonly element = document.createElement('td');
	private readonly btnV: HTMLButtonElement;
	private readonly btn1: HTMLButtonElement;
	private readonly btn2: HTMLButtonElement;
	private readonly btn3: HTMLButtonElement;
	private possibleValuesInternal = PossibleValue.All;
	private canSelectInternal = false;
	private solvedValueInternal = SelectedValue.None;
	selectedValue = SelectedValue.None;
	constructor(parent: HTMLElement, public onSelectChange: (value: SelectedValue) => void) {
		this.btnV = this.createButton(SelectedValue.Voltorb, '0');
		this.btn1 = this.createButton(SelectedValue.Coin1, '1');
		this.btn2 = this.createButton(SelectedValue.Coin2, '2');
		this.btn3 = this.createButton(SelectedValue.Coin3, '3');

		parent.appendChild(this.element);
		this.canSelect = false;
	}
	private createButton(value: SelectedValue, displayText: string) {
		const button = document.createElement('button');
		button.onclick = () => {
			this.onSelectChange(this.selectedValue = value);
			this.updateButtonsStatus();
		}
		button.innerText = displayText;
		button.classList.add('analyze');
		this.element.appendChild(button);
		return button;
	}
	private updateButtonsStatus() {
		this.updateButtonStatus(this.btnV, PossibleValue.Voltorb, SelectedValue.Voltorb);
		this.updateButtonStatus(this.btn1, PossibleValue.Coin1, SelectedValue.Coin1);
		this.updateButtonStatus(this.btn2, PossibleValue.Coin2, SelectedValue.Coin2);
		this.updateButtonStatus(this.btn3, PossibleValue.Coin3, SelectedValue.Coin3);
	}
	private updateButtonStatus(button: HTMLButtonElement, value: PossibleValue, index: SelectedValue) {
		const isPossible = !!(value & this.possibleValuesInternal);
		const isSelected = index === this.selectedValue;
		button.disabled = this.canSelectInternal || !isPossible;

		if (index === SelectedValue.Voltorb) {
			button.classList.add('voltorb');
		}
		else {
			button.classList.remove('voltorb');
		}

		if (this.solvedValueInternal) {
			if (this.solvedValueInternal === index) {
				button.classList.add('selected');
				button.classList.remove('impossible');
			}
			else {
				button.classList.remove('voltorb');
				button.classList.remove('selected');
				button.classList.add('impossible');
			}
		}
		else {
			if (index === SelectedValue.Voltorb) {
				button.classList.add('voltorb');
			}
			else {
				button.classList.remove('voltorb');
			}

			if (!isPossible) {
				button.classList.add('impossible');
			}
			else {
				button.classList.remove('impossible');
			}

			if (isSelected) {
				button.classList.add('selected');
			}
			else {
				button.classList.remove('selected');
			}
		}
	}
	get canSelect() {
		return this.canSelectInternal;
	}
	set canSelect(value) {
		this.canSelectInternal = value;
		this.updateButtonsStatus();
	}
	get possibleValues() {
		return this.possibleValuesInternal;
	}
	set possibleValues(value) {
		this.possibleValuesInternal = value;
		this.updateButtonsStatus();
	}
	get solvedValue() {
		return this.solvedValueInternal;
	}
	solve(value: SelectedValue) {
		this.solvedValueInternal = value;
		this.updateButtonsStatus();
	}
}

class Row {
	readonly element = document.createElement('tr');
	readonly cells: (InputCell | AnalyzeCell)[] = [];
	lastEnterPress = noopFunc;
	private static previousInputCell?: InputCell;
	private static createInputCell(row: Row) {
		const inputCell = new InputCell(row.element);
		if (this.previousInputCell) {
			this.previousInputCell.onEnterPressed = () => inputCell.focus();
		}
		row.cells.push(inputCell);
		this.previousInputCell = inputCell;
	}
	private static createGoButton(parent: HTMLElement, goFunc: () => void) {
		const button = document.createElement('button');
		button.innerText = 'Go!';
		button.style.width = '48px';
		button.style.height = '48px';
		button.onclick = () => goFunc();

		const cell = document.createElement('td');
		cell.appendChild(button);
		parent.appendChild(cell);

		return button;
	}
	static createRowCells(parent: HTMLElement, onSelect: (x: number, value: SelectedValue) => void) {
		const row = new this();
		parent.appendChild(row.element);

		for (let i = 0; i < 5; i++) {
			row.cells.push(new AnalyzeCell(row.element, value => onSelect(i, value)));
		}
		this.createInputCell(row);
		return row;
	}
	static createColCells(parent: HTMLElement, goFunc: () => void) {
		const row = new this();
		parent.appendChild(row.element);

		for (let i = 0; i < 5; i++) {
			this.createInputCell(row);
		}
		const goButton = this.createGoButton(row.element, goFunc);
		this.previousInputCell!.onEnterPressed = () => goButton.click();
		return row;
	}
}

export class Table implements AnalyzeTable {
	private readonly element = document.createElement('table');
	private readonly rows: Row[] = [];
	goFunc = noopFunc;
	onSelect: (x: number, y: number, value: number) => void = noopFunc;
	constructor(parent: HTMLElement) {
		for (let i = 0; i < 5; i++) {
			this.rows.push(Row.createRowCells(this.element, (x, value) => this.onSelect(x, i, value)));
		}
		this.rows.push(Row.createColCells(this.element, () => this.goFunc()));
		parent.appendChild(this.element);
	}
	coinsRow(y: number) {
		return (this.rows[y].cells[5] as InputCell).coins;
	}
	voltsRow(y: number) {
		return (this.rows[y].cells[5] as InputCell).volts;
	}
	coinsCol(x: number) {
		return (this.rows[5].cells[x] as InputCell).coins;
	}
	voltsCol(x: number) {
		return (this.rows[5].cells[x] as InputCell).volts;
	}
	outputAt(x: number, y: number) {
		return this.rows[y].cells[x] as AnalyzeCell;
	}
	lockInputs(): void {
		for (let y = 0; y < 5; y++) {
			(this.rows[y].cells[5] as InputCell).canChange = false;
		}
		for (let x = 0; x < 5; x++) {
			(this.rows[5].cells[x] as InputCell).canChange = false;
		}
	}
	setFlag(x: number, y: number, flags: PossibleValue) {
		(this.rows[y].cells[x] as AnalyzeCell).possibleValues = flags;
	}
	solve(x: number, y: number, value: SelectedValue) {
		(this.rows[y].cells[x] as AnalyzeCell).solve(value);
	}
}
