import type { GrammarUnit } from "../types";
import stage1 from "./grammar-stage1.json";

const RAW: unknown[] = [stage1];

export const ALL_GRAMMAR: GrammarUnit[] = RAW.flatMap(
  (e) => (e as { units: GrammarUnit[] }).units
);

export function getGrammarStage(stage: number): GrammarUnit[] {
  return ALL_GRAMMAR.filter((u) => u.stage === stage);
}
