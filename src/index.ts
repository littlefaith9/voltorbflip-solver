import { Analyzer } from "./analyzer";
import { Table } from "./page";

const table = new Table(document.body)
const analyzer = new Analyzer(table);
table.goFunc = () => analyzer.start();
table.onSelect = (x, y, v) => analyzer.updateFlagsCross(x, y, v);
