import type { GrammarUnitV2 } from "../types";
import core1 from "./grammar-core-1.json";
import core2 from "./grammar-core-2.json";
import core3 from "./grammar-core-3.json";

const RAW: unknown[] = [core1, core2, core3];

export const ALL_UNITS: GrammarUnitV2[] = RAW.flatMap(
  (e) => (e as { units: GrammarUnitV2[] }).units
);

export function getGrammarUnits(): GrammarUnitV2[] {
  return [...ALL_UNITS].sort((a, b) => a.no - b.no);
}

export function getGrammarUnit(id: string): GrammarUnitV2 | undefined {
  return ALL_UNITS.find(u => u.id === id);
}
