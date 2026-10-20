// A judging assignment: the officials of each mat area of a judo tournament, by seat, with their names and IDs, in the seat where they fit and in a chart where they do not; in 2D and in 3D.
export { judgingBoard, boardFoot, BOARD_BASE } from "./judging.board.ts";
export { JUDGING_PAPER, judgingPrint, judgingPrintSheets, judgingPrintStyle } from "./judging.print.ts";
export type { JudgingPrintOptions } from "./judging.print.ts";
export { KYOGIJO_JUDGING_BROADCAST_STYLE, mountJudgingBroadcast } from "./judging.mount.ts";
export { BROADCAST_RATIO } from "./judging.broadcast.ts";
export { drawJudging, judgingChart, judgingDrawing, judgingTable, judgingText } from "./judging.draw.ts";
export { JUDGING_HEIGHTS, JUDGING_PRESETS, buildJudgingTurn, judgingTurnMarkup, mountJudgingTurn } from "./judging.turn.ts";
export { JUDGING_LEAGUE, JUDGING_MATS_MAX, JUDGING_SEATS, JUDGING_SEAT_COUNT, JUDGING_SEAT_WORDS, JUDGING_STYLES } from "./judging.data.ts";
export { JUDGING_LIMITS, benchOf, judgingPlan, judgingSetting, matLabel, seatIn, seatOf, seatsOf } from "./judging.ts";
export { fitCard, fitChart, fitSeats, wrapText } from "./judging.fit.ts";
export { KYOGIJO_JUDGING_BOARD_STYLE, KYOGIJO_JUDGING_STYLE } from "./judging.style.ts";
export { JUDGING_WORDS } from "./judging.words.ts";
export type { JudgingWords } from "./judging.words.ts";
export type { JudgingAssignment, JudgingMat, JudgingOfficial, JudgingOptions, JudgingResolved, JudgingSeat, JudgingStyle } from "./judging.types.ts";
export type { JudgingDrawing } from "./judging.draw.ts";
export type { JudgingPlan, JudgingSetting, MatPlaces, SeatPlace } from "./judging.ts";
export type { CardAsk, CardFit } from "./judging.fit.ts";
