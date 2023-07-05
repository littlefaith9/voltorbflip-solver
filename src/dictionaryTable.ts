import type { DictionaryItem, DictionaryPage } from "./dictionary";
import { DictionaryTable } from "./interfaces";

export class TableDictionary implements DictionaryTable {
	private readonly tableElement = document.createElement('table');
	private readonly nodesIndex = new Map<DictionaryItem, number>();
	constructor(parent: HTMLElement) {
		parent.appendChild(this.tableElement);
		this.renderTable();
	}
	private renderTable() {
		const row = this.tableElement.insertRow();
		row.insertCell().innerHTML = `<b>level</b>`;
		row.insertCell().innerHTML = `<b>x2s</b>`;
		row.insertCell().innerHTML = `<b>x3s</b>`;
		row.insertCell().innerHTML = `<b>coins</b>`;
	}
	private renderItem(item: DictionaryItem) {
		const row = this.tableElement.insertRow();
		this.nodesIndex.set(item, row.rowIndex);
		row.insertCell().innerText = item.level.toString();
		row.insertCell().innerText = item.x2s.toString();
		row.insertCell().innerText = item.x3s.toString();
		row.insertCell().innerText = item.coins.toString();
	}
	private removeItem(item: DictionaryItem) {
		const nodeIndex = this.nodesIndex.get(item);
		if (nodeIndex) {
			const itemIds = new Map<DictionaryItem, HTMLTableRowElement>();
			for (const [key, value] of this.nodesIndex.entries()) {
				itemIds.set(key, this.tableElement.rows[value]);
			}
			this.tableElement.deleteRow(nodeIndex);
			this.nodesIndex.delete(item);
			itemIds.delete(item);
			for (const [key, value] of itemIds.entries()) {
				this.nodesIndex.set(key, value.rowIndex);
			}
		}
		else {
			console.warn('Removing dictionary item that doesn\'t exist', item);
		}
	}
	setPage(page: DictionaryPage) {
		for (const key of this.nodesIndex.keys()) {
			this.removeItem(key);
		}
		for (const item of page.items) {
			this.renderItem(item);
		}
		page.onUpdated = () => {
			const existingItems = new Set(this.nodesIndex.keys());
			for (const item of page.items) {
				if (!existingItems.delete(item)) {
					this.renderItem(item);
				}
			}
			for (const item of existingItems.keys()) {
				this.removeItem(item);
			}
		}
	}
}