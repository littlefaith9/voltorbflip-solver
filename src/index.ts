import { Analyzer } from "./analyzer";
import { TableAnalyze } from "./analyzeTable";
import { Dictionary } from "./dictionary";
import { TableDictionary } from "./dictionaryTable";

(window as any).analyzer = new Analyzer(
	(window as any).dict = new Dictionary(),
	(window as any).analyzeTable = new TableAnalyze(document.body),
	(window as any).dictionaryTable = new TableDictionary(document.body),
);
