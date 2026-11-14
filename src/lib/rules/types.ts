import type { BillDoc, BillLine, EobDoc, EobLine, Flag, PlanContext } from "../schemas";
import type { Match } from "../match";

/** Everything a rule needs, precomputed once so every rule stays a small pure function. */
export type RuleInput = {
  bill: BillDoc;
  eobs: EobDoc[];
  eobLines: EobLine[];
  context: PlanContext;
  matches: Match[];
  /** bill line id -> matched EOB line */
  matched: Map<string, EobLine>;
  /** bill line ids that repeat an already-matched line (same date + code, or same description + amount) */
  duplicateOf: Map<string, BillLine>;
  /** total patient responsibility across all EOBs */
  eobTotal: number;
};

export type FlagDraft = Omit<Flag, "id">;

export type Rule = (input: RuleInput) => FlagDraft[];
