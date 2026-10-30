// What a judging picture says in words: the title and the description of an assignment, each mat with each seat and who is in it. Shared by the plan view, the broadcast view and the 3D view.
import { JUDGING_WORDS } from "./judging.words.ts";
import type { JudgingSetting } from "./judging.ts";
import type { JudgingAssignment, JudgingOptions } from "./judging.types.ts";
import { fill } from "./strings.core.ts";

/** The sentence that names one seat and who sits in it. */
function seatSentence(a: JudgingAssignment, setting: Pick<JudgingSetting, "language">): string {
  const w = JUDGING_WORDS[setting.language].say;
  const seat = a.seat.label[setting.language];
  if (!a.assigned) return fill(w.seatVacant, { seat });
  if (a.id === "") return fill(w.seatNoId, { seat, name: a.name });
  return fill(w.seat, { seat, name: a.name === "" ? "—" : a.name, id: a.id });
}

/** The title and the description of an assignment: each mat with each seat and who is in it. */
export function judgingText(setting: JudgingSetting, options: Pick<JudgingOptions, "title" | "description">, chart: boolean, view: "plan" | "broadcast" = setting.view): { title: string; description: string } {
  const words = JUDGING_WORDS[setting.language];
  const style = fill(words.styleName[setting.style], { count: setting.mats[0].seats.length });
  const mats = setting.total === 1 ? words.say.matsOne : fill(words.say.matsMany, { n: setting.total });
  const title = options.title ?? fill(words.say.title, { style, mats });
  const sentences = setting.mats.map((m) => fill(words.say.mat, { label: m.label, seats: m.seats.map((a) => seatSentence(a, setting)).join(words.say.join) }));
  const description = options.description ?? [...sentences, view === "broadcast" ? words.say.board : chart && setting.seatNames ? words.say.names : words.say.chartOnly].join(setting.language === "ja" ? "" : " ");
  return { title, description };
}

