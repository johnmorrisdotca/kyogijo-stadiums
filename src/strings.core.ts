import type { RuleId } from "./rules.types.ts";
import type { Language, RangeName, Sport } from "./types.ts";

/** The words of a game's situation (`situation`): the short ones on the pills and tags, and the sentences of the description. */
export interface SituationWords {
  /** The teams when the drawing names none. */
  home: string;
  away: string;
  /** The labels of the shootout's two rows when the drawing names no team. */
  homeShort: string;
  awayShort: string;
  /** Hockey's short words on the pill: the power play, the empty net, a delayed penalty, the shootout and its sudden-death rounds. */
  pp: string;
  en: string;
  delayed: string;
  shootout: string;
  /** The shootout's word where the rulebook calls it the game winning shots: the IIHF's, the Olympic and the Japanese leagues'. */
  gws: string;
  sudden: string;
  /** Hockey sentences ({team}, {a}, {b}, {clock}, {n}, {away}, {home}, {awayGoals}, {homeGoals}). */
  powerPlay: string;
  strength: string;
  penaltyTime: string;
  emptyNet: string;
  delayedPenalty: string;
  shootoutScore: string;
  gwsScore: string;
  suddenDeath: string;
  /** Baseball: {half} is `top` or `bottom`, {n} the inning, {nth} the inning as an ordinal ({list} the bases, {b} the balls, {s} the strikes). */
  top: string;
  bottom: string;
  inning: string;
  inningOnly: string;
  halfOnly: string;
  noOuts: string;
  oneOut: string;
  outs: string;
  basesEmpty: string;
  basesLoaded: string;
  runnersOn: string;
  bases: readonly [string, string, string];
  and: string;
  count: string;
  /** Football: the down's ordinal (first to fourth), the tag ({ord}, {n}), the sentences ({ord}, {n}, {team}, {where}, {from}, {to}, {result}). */
  downs: readonly [string, string, string, string];
  tag: string;
  tagGoal: string;
  down: string;
  downDistance: string;
  downGoal: string;
  ballOwn: string;
  ballOpp: string;
  ballMid: string;
  /** A yard line in a drive's sentence and on the tag: {n}. */
  placeOwn: string;
  placeOpp: string;
  placeMid: string;
  tagOwn: string;
  tagOpp: string;
  redZone: string;
  possession: string;
  driveLine: string;
  driveNoResult: string;
  results: Readonly<Record<"touchdown" | "field-goal" | "missed-field-goal" | "punt" | "turnover" | "interception" | "fumble" | "downs" | "safety" | "end-of-half", string>>;
}

/** The words of a folded curling sheet: the labels of its enlarged ends and the sentences that say what is drawn. */
export interface FoldedWords {
  top: string;
  bottom: string;
  left: string;
  right: string;
  /** A tall sheet's panels are at the sides, a wide sheet's above and below. */
  tall: string;
  wide: string;
  half: string;
  house: string;
  data: string;
}

/** The words of the skating data: the pairs of a race, its results, its replay and the elements of a programme as marks. */
export interface SkatingData {
  /** Titles ({race}). */
  draw: string;
  results: string;
  replay: string;
  elements: string;
  /** Sentences ({n}, {race}, {winner}, {time}, {who}, {inner}, {outer}). */
  summaryDraw: string;
  summaryGrid: string;
  summaryResults: string;
  summaryReplay: string;
  summaryElements: string;
  /** The heads of the tables, a pair ({n}) and a lane. */
  columns: { place: string; pair: string; lane: string; skater: string; country: string; time: string; splits: string; laps: string; note: string; element: string; kind: string; order: string };
  pair: string;
  lanes: { inner: string; outer: string };
  medals: { gold: string; silver: string; bronze: string };
  /** A split ({d}, {t}) and a lap ({n}, {t}). */
  split: string;
  lap: string;
  /** What a layer is called. */
  layers: { names: string; flags: string; medals: string; splits: string; elements: string; paths: string };
  gun: string;
  finish: string;
  seconds: string;
  metres: string;
}

/** The words of the athletics data: the lane draw, the results, the replay and the marks of a field event. */
export interface AthleticsData {
  /** Titles ({race}, {event}). */
  draw: string;
  results: string;
  replay: string;
  marks: string;
  /** Sentences ({n}, {race}, {first}, {last}, {winner}, {time}, {best}, {who}, {event}). */
  summaryDraw: string;
  summaryResults: string;
  summaryMarks: string;
  summaryReplay: string;
  /** The heads of the results table, and the medals, a reaction time ({t}) and a split ({d}, {t}). */
  columns: { place: string; lane: string; athlete: string; country: string; time: string; reaction: string; splits: string; note: string; distance: string; round: string; valid: string };
  medals: { gold: string; silver: string; bronze: string };
  reaction: string;
  split: string;
  foul: string;
  best: string;
  yes: string;
  no: string;
  /** What a layer is called ({name} of an athlete): the flags, the names, the medals, the splits, the reaction times, the marks. */
  layers: { names: string; flags: string; medals: string; splits: string; reactions: string; attempts: string; best: string };
  /** The start of a replay: the gun; a finish ({name}, {time}). */
  gun: string;
  finish: string;
  /** The unit and the abbreviations used in the table: seconds and metres. */
  seconds: string;
  metres: string;
}

/** The words the drawing says itself, in English and Japanese. */
export interface KyogijoWords {
  /** The name of each surface. */
  surface: Record<Sport, string>;
  /** What each surface is, for the description: a sentence fragment. */
  about: Record<Sport, string>;
  /** The standard statuses. */
  status: Record<"final" | "final-ot" | "final-so" | "final-aet" | "final-pens" | "live" | "half" | "extra-time" | "extra-end" | "penalties" | "postponed" | "tiebreak" | "match-tiebreak" | "retired" | "walkover", string>;
  /** A curling end as a status: {n} is the end's number. */
  endStatus: string;
  /** A set and a game as a status: {n} is its number. */
  setStatus: string;
  gameStatus: string;
  /** The soccer pitch: its names, and the descriptions with {length} and {width} in metres. */
  soccer: { futsal: string; aboutFutsal: string; half: string };
  /**
   * The league surfaces (`league` in the options): what each family of surface is, for the description, with the surface's `{size}`
   * (written with `size`, `{length}` and `{width}` in a `{unit}`) or a diamond's `{base}` and `{pitch}` in feet.
   */
  league: { basketball: string; hockey: string; football: string; baseball: string; softball: string; curling: string; tennis: string; volleyball: string; beachVolleyball: string; badminton: string; pickleball: string; tabletennis: string; sittingVolleyball: string; padel: string; squash: string; racquetball: string; sepaktakraw: string; teqball: string; roundnet: string; netball: string; lacrosse: string; lacrosseBox: string; rugby: string; rugbyLeague: string; afl: string; gaelic: string; hurling: string; cricket: string; fieldhockey: string; handball: string; athletics: string; skating: string; size: string; units: { ft: string; yd: string; m: string } };
  /**
   * A ballpark's walls and quirks (`walls` and `quirks`): the words of the legend and the labels, of where a wall stands, and the sentences of the description.
   * `{unit}` is `unit.ft` or `unit.m`; `{name}` is the name the park's article gives a wall or a quirk, else the kind's own name.
   */
  ballpark: {
    heading: string;
    sections: Record<"outfield" | "left" | "leftCenter" | "center" | "deadCenter" | "rightCenter" | "right" | "leftToCenter" | "centerToRight" | "leftCorner" | "rightCorner", string>;
    unit: { ft: string; m: string };
    tiers: { under: string; between: string; over: string };
    height: string;
    walls: string;
    quirks: string;
    kinds: {
      hillName: string; hill: string; hillSlope: string;
      overhangName: string; overhang: string;
      poleName: string; flagpoleName: string; pole: string;
      bullpen: string; bullpenHome: string; bullpenVisitors: string; bullpenItem: string;
      ivy: string; basket: string;
      backstop: string;
      dugoutHome: string; dugoutVisitors: string; first: string; third: string;
    };
  };
  /** The net sports' scores: who is serving ({name}), a team's points in each set ({name}, {list}) or game, the points of the game in progress ({name}, {points}), and the heads of the board's columns. */
  net: { serving: string; bySet: string; byGame: string; gamePoints: string; sets: string; games: string; points: string };
  /**
   * The field sports' scores: an Australian football team's goals and behinds ({name}, {goals}, {behinds}), a Gaelic games team's goals and points ({name}, {goals}, {points}), a cricket team's runs, wickets and overs
   * ({name}, {runs}, {wickets}, {overs}) and its innings ({name}, {list}), a cricket innings as a status ({n}), and the heads of the cricket board's columns.
   */
  field: { aflScore: string; gaelicScore: string; cricketScore: string; cricketInnings: string; inningsStatus: string; innings: string; runs: string; wickets: string; overs: string; total: string };
  /**
   * The pools (swimming, water polo, diving and artistic swimming): the size ({length}, {width}), the lanes ({n}), what each pool is for the description ({size}, {lanes}, {boards}, {list}), the boards of a diving well,
   * the names of the pools of a hall, and a race's sentences: the lane ({lane}, {name}), the country ({abbr}), the place ({n}), the medal, the time ({time}), the reaction time ({rt}), the splits ({list}) and a record ({record}).
   */
  pool: {
    size: string;
    lanes: string;
    laneOne: string;
    aboutSwimming: string;
    aboutWarmUp: string;
    aboutWaterPolo: string;
    aboutDiving: string;
    aboutArtistic: string;
    boards: string;
    platforms: string;
    and: string;
    /** What joins the items of a list, and its last one. */
    sep: string;
    last: string;
    deep: string;
    venue: string;
    section: string;
    names: Record<"competition" | "diving" | "warmUp" | "waterPolo" | "artistic" | "seating", string>;
    lane: string;
    abbr: string;
    place: string;
    medal: Record<"gold" | "silver" | "bronze", string>;
    status: Record<"dq" | "dns" | "dnf", string>;
    seed: string;
    time: string;
    reaction: string;
    splits: string;
    record: string;
    pace: string;
    paceBar: string;
    event: string;
    joiner: string;
    /** The split pace chart and the race replay: the title, the summary ({n} swimmers, {name}, {time}), the table's heads and the replay's events. */
    chart: { title: string; summary: string; fastest: string; headLane: string; headName: string; headTime: string; headSplit: string; headPace: string; headReaction: string; caption: string; turn: string; finish: string; start: string; perHundred: string };
  };
  /**
   * The athletics track's description: the track of 400 metres ({lanes}) and the covered one of 200, what is inside the track, which field events and races are marked ({list}), a close-up of a start ({race})
   * and a field event alone ({event}), and where the water jump is ({where}).
   */
  /**
   * The skating rink's description: the long track ({radius}, {outer}, {straight}), the short track ({length}, {width}, {tracks}) and the figure skating rink ({length}, {width}), the races marked ({list}),
   * the furniture ({list}), a close-up of a start ({race}) and of the finish.
   */
  skating: { longTrack: string; shortTrack: string; figure: string; races: string; furniture: string; furnitureNames: Record<"judges" | "referee" | "technical-panel" | "kiss-and-cry", string>; start: string; finish: string; data: SkatingData };
  athletics: { track400: string; track200: string; infieldPitch: string; infieldGrass: string; infieldNone: string; events: string; races: string; start: string; finish: string; layout: string; waterJump: string; inside: string; outside: string; lane: string; ground: string; data: AthleticsData };
  /**
   * The budō surfaces' description (judo, karate, kendo, sumo, kyūdō and a dojo): each a fragment with its figures ({contest}, {safety}, {tatami}, {area}, {side}, {height}...), the sentences
   * that follow it, the names of the four sides, and the words of the scoreboards.
   */
  budo: {
    sides: Record<"north" | "south" | "east" | "west", string>;
    judo: string;
    judoMany: string;
    judoKata: string;
    danger: string;
    platform: string;
    start: string;
    officials: string;
    tatami: string;
    karate: string;
    karateMany: string;
    karateKata: string;
    karateOfficials: string;
    kendo: string;
    sumo: string;
    sumoBare: string;
    tassels: string;
    kyudo: string;
    kyudoEnteki: string;
    dojoTraditional: string;
    dojoCompetition: string;
    dojoChecker: string;
    dojoBorder: string;
    dojoKamiza: string;
    dojoShinzen: string;
    dojoDais: string;
    dojoBanner: string;
    dojoAreas: string;
    dojoWalls: string;
    /** An MMA cage: the sentence ({width}, {feet}, {fence}, {platform}), the platform it stands on ({height}) or the floor it stands at, and the sentences about its gates and its steps. */
    mma: string;
    mmaPlatform: string;
    mmaFloor: string;
    mmaGates: string;
    mmaSteps: string;
    /** A boxing ring: the sentence ({size}, {feet}, {apron}, {platform}), the platform it stands on ({height}) or the floor, and the sentences about its corners and its steps. */
    boxing: string;
    boxingPlatform: string;
    boxingFloor: string;
    boxingCorners: string;
    boxingSteps: string;
    /** A wrestling mat: the UWW's ({circle}, {border}, {band}, {platform}) and a folkstyle mat's ({feet}, {circle}, {border}, {platform}), the platform it stands on ({height}) or the floor, and the sentences about its middle circle ({d}) and its starting lines. */
    wrestlingUww: string;
    wrestlingFolk: string;
    wrestlingPlatform: string;
    wrestlingFloor: string;
    wrestlingCentre: string;
    wrestlingLines: string;
    /** A professional wrestling ring: the sentence ({size}, {feet}, {apron}, {platform}; the platform parts are the boxing ring's), and the sentences about its ropes and its steps. */
    prowrestling: string;
    prowrestlingRopes: string;
    prowrestlingSteps: string;
    /** The scoreboards: the heads and the sentences that say what each side scored. */
    board: { ippon: string; wazaari: string; yuko: string; shido: string; senshu: string; chui: string; points: string; kimarite: string; techniques: Record<"men" | "kote" | "do" | "tsuki" | "hansoku", string>; judoScore: string; karateScore: string; kendoScore: string; sumoScore: string };
  };
  /** The title of a score: placeholders {away}, {awayScore}, {home} and {homeScore}. */
  scoreTitle: string;
  /** The sentences of a description. */
  said: {
    home: string;
    away: string;
    won: string;
    tied: string;
    park: string;
    /** What a park or a ground officially is called when that is not the name the drawing uses: {name}. */
    officially: string;
    /** A soccer ground drawn at its published size, or without one: {ground}. */
    ground: string;
    groundDefault: string;
    /** The title of an arena's drawing: {arena}. */
    arenaRink: string;
    arenaCourt: string;
    /** What an arena drawn at the size its sources publish is, in place of the league's description: {length} and {width} in feet, {lengthM} and {widthM} in metres. */
    arenaRinkAbout: string;
    arenaCourtAbout: string;
    /** The size is the one published for {arena}. */
    arenaSize: string;
    /** An arena whose rink is said to have been shorter than the NHL's, with no size given: {arena}. */
    arenaUnknown: string;
    /** The stands of an arena's real venue: {seats} seats in {tiers} tiers, fitted inside the outline of {arena}'s building from OpenStreetMap. */
    real: string;
    /** How the rink lies in it: along the building's long axis (an inference), as OpenStreetMap maps the ice, or not known. */
    realBuilding: string;
    realMapped: string;
    realNone: string;
    /** The stands of a stadium's real venue: {seats} seats in {tiers} bowls, fitted inside the outline of {stadium}'s building from OpenStreetMap. */
    stadium: string;
    /** How the field lies in it: along the roof's opening (which is the field's size), along the building's long axis (an inference), or not known. */
    stadiumOpening: string;
    stadiumBuilding: string;
    stadiumNone: string;
    /** A ballpark's stands: {seats} seats fitted inside the outline of {stadium}'s building; and how the pitch or the infield says the field lies. */
    stadiumPark: string;
    stadiumPitch: string;
    stadiumInfield: string;
    stadiumStreets: string;
    stadiumHall: string;
    stadiumRingBuilding: string;
    stadiumCourtBuilding: string;
    stadiumPitchPark: string;
    stadiumNonePark: string;
    /** A district: a plan of {count} real venues at their real positions, {mode}; and what `mode` says for the two kinds of plan, and the word before the credit. */
    district: string;
    districtNeighbours: string;
    districtCity: string;
    districtCredit: string;
    /** The people outside a district's venues: {percent} of the venues' seats, {people} people, on ground people may stand on. */
    districtOutside: string;
    /** A game decided on penalties: {name}, and the shoot-out score {a}-{b}, winner first. */
    wonPens: string;
    /** The shoot-out, as it is written beside a status: {a} and {b}, in the order of the sides on the drawing. */
    pens: string;
    /** For a drawing of a past season: {season} is `1979–80` or `1974`. */
    era: string;
    on: string;
    /** Curling: the team that has the hammer ({name}), and a team's score in each end ({name}, {list}). */
    hammer: string;
    ends: string;
    /** The row of a curling board that holds the totals. */
    total: string;
    /** What joins a title's parts. */
    sep: string;
    /** The end of a sentence, the colon, and what goes between sentences. */
    stop: string;
    colon: string;
    gap: string;
  };
  /** The pageant, in a drawing's description: what lies over each half ({carpet}, {stage}), and the emblem in the middle, with its name ({name}) or without. */
  pageant: { carpet: string; stage: string; emblem: string; emblemNamed: string };
  /** A game's situation: hockey's skaters and shootout, baseball's bases, outs and count, football's down and distance and drives. */
  situation: SituationWords;
  /**
   * A special game, one surface set inside another: the title ({guest} is the inner surface, {host} where it is), the sentence that names the game ({event}, {date}),
   * whether the surface lies wholly inside the host ({guest}, {host}) or reaches beyond it ({pct} percent of its area), how its place was decided, and the date.
   */
  special: {
    /** What the inner surface is called in these sentences, by sport: the rink, the court. */
    guest: Record<Sport, string>;
    title: string;
    game: string;
    inside: string;
    hangs: string;
    /** For a ballpark, whose outline is the fair ground inside the fence: what a surface over the infield does to it. */
    foul: string;
    /** What a host with no name of its own is called: a football `field`, a soccer `pitch`, a `deck`. */
    unnamed: Record<"field" | "pitch" | "deck", string>;
    published: string;
    convention: string;
    /** The conventions that place a surface when no source gives where: `infield`, `midfield`, `diamond` and `deck`. */
    rules: Record<"infield" | "midfield" | "diamond" | "deck", string>;
    /** The twelve months, comma-separated, a date ({month}, {day}, {year}), and what joins two dates. */
    months: string;
    date: string;
    and: string;
  };
  /** The words of the ready-made charts (`nbaShotChart` and the rest): their titles, the names of their marks, the key and the sentences that sum them up. */
  charts: {
    titleNba: string;
    titleNhl: string;
    titleMlb: string;
    titleNfl: string;
    titleSoccer: string;
    titleGoal: string;
    /** The curling chart: its title, an end ({n}), the names of its marks, a stone's tooltip ({name}, {d} feet) with the notes added to it, and the sums ({n} stones, {team}, {points}). */
    titleCurling: string;
    curlingEnd: string;
    curlingStone: string;
    curlingCounting: string;
    curlingShot: string;
    curlingFrom: string;
    curlingNoteCounting: string;
    curlingNoteShot: string;
    sumCurling: string;
    sumCurlingBlank: string;
    curlingOut: string;
    /** The heat chart of stones at rest: its title, its legend's heading, the sum ({n} stones, {house} in the house, {guards} free guards), and the sentences that say which stones were kept ({name}). */
    titleCurlingHeat: string;
    curlingHeatStat: string;
    sumCurlingHeat: string;
    curlingHeatTeam: string;
    curlingHeatGuards: string;
    curlingHeatHouse: string;
    /** What the marks of each chart are, as a plural noun for a layer's title: "24 shots". */
    shots: string;
    passes: string;
    balls: string;
    ballsBeyond: string;
    lineOfScrimmage: string;
    key: string;
    /** The outcomes, as the key and the summaries name them. */
    made: string;
    missed: string;
    missedNet: string;
    goal: string;
    saved: string;
    blocked: string;
    shot: string;
    post: string;
    single: string;
    double: string;
    triple: string;
    homeRun: string;
    out: string;
    complete: string;
    incomplete: string;
    touchdown: string;
    interception: string;
    /** The key's note on the size of a mark, and the expected-goals total written beside the key: {n}. */
    sizeXg: string;
    /** The sentence on the size of the marks. */
    sizeNote: string;
    xgTotal: string;
    /** What the statistics of the zones are called. */
    fgRate: string;
    completionRate: string;
    goalRate: string;
    xgStat: string;
    hitRate: string;
    /** The note on a diverging ramp: {league} is the league's percent. */
    leagueNote: string;
    /** The sums: {shots}, {made}, {pct}, {goals}, {xg}, {balls}, {list}, {passes}, {complete}, {td}, {int}. */
    sumNba: string;
    sumShots: string;
    sumShotsXg: string;
    sumMlb: string;
    sumNfl: string;
    /** The sentence on the balls that came down beyond the fence: {n}. */
    beyondNote: string;
    /** The air yards of a layer of passes: {min} and {max}. */
    airYards: string;
    /** The goal-mouth view's description: {w} and {h} in metres. */
    goalDesc: string;
    /** The pass network: its title, the key's notes on the size of a node and the width of a link, and its sum: {passes}, {players}, {links}. */
    titlePassNetwork: string;
    sizeTouches: string;
    widthPasses: string;
    sumNetwork: string;
  };
  /** The words of a data layer's summary and of the table that stands for it. */
  layers: {
    pointOne: string;
    pointMany: string;
    lineOne: string;
    lineMany: string;
    arrowOne: string;
    arrowMany: string;
    textOne: string;
    textMany: string;
    /** A layer's title: {n} marks and what they are, {noun}. */
    count: string;
    /** One entry of a count by outcome or by team: {name} and {n}. */
    item: string;
    /** What joins the entries. */
    listSep: string;
    outcomes: string;
    teams: string;
    values: string;
    skipped: string;
    /** The lead of the layers' summary in the drawing's description. */
    data: string;
    tableNo: string;
    tableX: string;
    tableY: string;
    tableToX: string;
    tableToY: string;
    tablePath: string;
    tableValue: string;
    tableTeam: string;
    tableOutcome: string;
    tableNote: string;
    tableText: string;
    /** The caption's note on the coordinates: {frame} and {unit}. */
    tableFrame: string;
    /** The caption's note when rows are left out: {shown} and {total}. */
    tableMore: string;
    /** The title of a heat map, a hexagon map, a zone chart and a density chart: {n} marks and what they are, {noun}. */
    heatTitle: string;
    hexTitle: string;
    zonesTitle: string;
    contourTitle: string;
    /** A legend's title: {name} is the statistic. */
    legendTitle: string;
    /** What a legend or a summary says about a range: {min} and {max}. */
    range: string;
    /** The sentences of a summary: the statistic {stat}, the count {n} and the range {min} to {max}. */
    heatNote: string;
    hexNote: string;
    zoneNote: string;
    contourNote: string;
    /** The most of them: {list}. */
    top: string;
    /** Marks that fell outside the grid or the zones: {n}. */
    outside: string;
    /** What a statistic is called. */
    stat: Record<"count" | "sum" | "mean" | "median" | "percent" | "max" | "min" | "rate" | "custom" | "density" | "mass", string>;
    tableZone: string;
    tableCount: string;
    tableShare: string;
    tableLevel: string;
    tableCell: string;
    /** The caption of a heat map's table, with the cells' centres in a frame: {frame} and {unit}, as for a layer of points. */
    tableCells: string;
    /** The same when the cells are in the surface's own feet and there is no frame to name: {stat} and {unit}. */
    tableCellsPlain: string;
    /** One entry of the list of the hottest cells or zones: {name} and the formatted {n}. */
    valueItem: string;
    /** The names of the zones, and the words they are made from. */
    zones: {
      /** Two words joined: {a} and {b}. */
      pair: string;
      /** A name with the end of the court or rink it is at: {name} and {end}. */
      atEnd: string;
      endLeft: string;
      endRight: string;
      band: string;
      zone: string;
      wingLeft: string;
      halfLeft: string;
      laneCentre: string;
      halfRight: string;
      wingRight: string;
      defensiveThird: string;
      poolLane: string;
      poloGoalArea: string;
      poloTwoToSix: string;
      poloBeyondSix: string;
      poolNear: string;
      poolMiddle: string;
      poolFar: string;
      middleThird: string;
      attackingThird: string;
      restricted: string;
      paint: string;
      midRange: string;
      cornerLeft: string;
      cornerRight: string;
      aboveBreak: string;
      innerSlot: string;
      outerSlot: string;
      offensiveZone: string;
      behindGoalLine: string;
      homePlate: string;
      outsideHomePlate: string;
      pull: string;
      opposite: string;
      sprayCentre: string;
      leftField: string;
      centreField: string;
      rightField: string;
      infield: string;
      outfield: string;
      lengthShort: string;
      lengthDeep: string;
      houseButton: string;
      houseFour: string;
      houseEight: string;
      houseTwelve: string;
      guardZone: string;
      frontCourt: string;
      backCourt: string;
      halfCourt: string;
      outsideCircles: string;
      servingRing: string;
      noHitZone: string;
      sideLeft: string;
      sideMiddle: string;
      pitchZone: string;
      insideCircle: string;
      outfieldGround: string;
      /** The athletics track's zones: the infield, the finish straight, the first bend, the back straight and the second bend. */
      trackInfield: string;
      homeStraight: string;
      firstBend: string;
      backStraight: string;
      secondBend: string;
      /** The skating rink's zones: the crossing straight, and the left end, the middle and the right end of a figure skating rink. */
      crossingStraight: string;
      firstCurve: string;
      secondCurve: string;
      finishStraight: string;
      rinkLeft: string;
      rinkMiddle: string;
      rinkRight: string;
      /** The budō surfaces' zones: the contest area and the safety area, the boundary band, the floor, the clay, the sand and the ring of a dohyō, the shajō, the yamichi and the azuchi, the kamiza and the rest. */
      budoContest: string;
      budoSafety: string;
      budoBand: string;
      budoFloor: string;
      budoClay: string;
      budoJano: string;
      budoRing: string;
      budoShajo: string;
      budoYamichi: string;
      budoAzuchi: string;
      budoKamiza: string;
      budoRest: string;
      sideRight: string;
    };
  };
  /** The words of the team layers (pass networks, formations, Voronoi cells, triangulations, hulls, flow fields and sonars): their titles and sentences, and the heads of their tables. */
  team: {
    /** A pass network's title: {players}, {links} and {passes}. */
    networkTitle: string;
    /** Its sentence: the player with most touches {name} and {touches}, and the strongest link {a}, {b} and {n}. */
    networkNote: string;
    networkNoteDirected: string;
    /** The sentence on the links left out: {n} is the least number of passes a link has. */
    networkMin: string;
    /** The tooltip of a node: {name}, {touches}, {made} and {received}. */
    nodeTitle: string;
    /** The tooltip of a link, undirected and directed: {a}, {b} and {n}. */
    linkTitle: string;
    linkTitleDirected: string;
    /** A formation's title: {name} and {n} positions; the list of positions {list}; the list of players {list}, each as {who} and {position}. */
    formationTitle: string;
    formationNote: string;
    formationPlayers: string;
    formationItem: string;
    /** A lineup: the title ({name} and {n} players), the captain ({who}), the volleyball rotation ({n}), the players with no place ({list}), the armband's tooltip and letter, and the head of the captain column. */
    lineupTitle: string;
    lineupCaptain: string;
    lineupRotation: string;
    lineupUnplaced: string;
    captainTip: string;
    captainMark: string;
    tableCaptain: string;
    /** Space control: the title ({n} players), the share of the surface nearest each team ({list}; each {name} and {pct}) and the players who share a place with another ({n}). */
    voronoiTitle: string;
    voronoiNote: string;
    shareItem: string;
    voronoiShared: string;
    /** The triangulation: the title ({n} players) and the sentence ({triangles} and {edges}). */
    delaunayTitle: string;
    delaunayNote: string;
    /** The hull: the title ({n} players), one team's sentence ({name}, {n}, {area}, {unit}) and the name of a hull of all the players. */
    hullTitle: string;
    hullItem: string;
    hullAll: string;
    /** The area unit of a hull, by the unit of the frame ({unit} for any other unit): "square metres". */
    squareUnits: { ft: string; yd: string; m: string };
    squareOther: string;
    /** The flow field: the title ({n} movements, {cells} cells) and the sentence ({len} and {unit}). */
    flowTitle: string;
    flowNote: string;
    /** The sonar: the title ({n} movements, {roses} roses and {angles} directions), the sentence on the commonest direction ({deg} and {n}), the note on the angles, and the tooltips of a rose ({name}, {n}, {deg}) and of a bar ({from}, {to}, {value}). */
    sonarTitle: string;
    sonarNote: string;
    sonarAngles: string;
    roseTitle: string;
    barTitle: string;
    /** The heads of the tables. */
    tablePlayer: string;
    tableFrom: string;
    tableTo: string;
    tablePasses: string;
    tableMade: string;
    tableReceived: string;
    tableTouches: string;
    tablePosition: string;
    tableNumber: string;
    tableName: string;
    tablePlayers: string;
    tableShare: string;
    tableArea: string;
    tableCorners: string;
    tableTriangles: string;
    tableEdges: string;
    tableDirection: string;
    tableLength: string;
    tableSteady: string;
    tableFromAngle: string;
    tableToAngle: string;
    tableRose: string;
    /** The caption's note on a table of areas and lengths: {unit}. */
    tableUnit: string;
  };
  /** The words of the annotations (`direction`, `axes` and `landmarks`): the teams, the sentences of the description and the name of each part of a surface. */
  notes: {
    home: string;
    away: string;
    /** By an attack arrow: {team}. */
    attacking: string;
    left: string;
    right: string;
    /** What the description says of an arrow: {team}, {side}, and for a period {n}. */
    attacks: string;
    attacksIn: string;
    /** What it says of the axes: the frame's name or the surface's own, its unit and the range of each axis. */
    axesSurface: string;
    axesFrame: string;
    /** The parts that are labelled: {list}. */
    labelled: string;
    /** The name of each part of a surface that can be labelled, by the key a builder gives it. */
    names: Record<string, string>;
  };
  /**
   * The words of a range (`range`, the part of a surface a drawing is cropped to): the sentences of the description, {name} being the range's name below and {side} `left` or
   * `right` as `notes` says it; for a box of your own {x0}, {x1}, {y0} and {y1} (and the {frame}); and the name of each range, written to follow "shows only the".
   */
  ranges: { shows: string; showsEnd: string; box: string; boxFrame: string; cut: string; names: Record<RangeName, string>; folded: FoldedWords };
  /**
   * The words of a grid of drawings (`drawGrid`): its accessible title when the caller gives none ({n} drawings), the sentence that lists the drawings ({n}, {list}), the one
   * that lists the key ({list}), the name of a drawing that has none ({n} of {total}), and what joins a list.
   */
  grid: { title: string; drawings: string; key: string; cell: string; listSep: string };
  /** The words of a replay: its summary, its marks, what is announced when something happens, and the controls under it. */
  replay: {
    /** The first sentence of the summary: {time} is the length. */
    title: string;
    objects: string;
    objectsOne: string;
    events: string;
    eventsOne: string;
    players: string;
    others: string;
    /** The title of a trail's layer: {s} seconds. */
    trail: string;
    numbers: string;
    eventLines: string;
    /** The names of the teams and the other things tracked. */
    home: string;
    away: string;
    ball: string;
    puck: string;
    official: string;
    /** The standard kinds of event. */
    pass: string;
    shot: string;
    goal: string;
    whistle: string;
    /** What is said when an event goes by: {what}, {team} and {time}. */
    announce: string;
    announceTeam: string;
    group: string;
    play: string;
    pause: string;
    back: string;
    forward: string;
    stepBack: string;
    stepForward: string;
    speed: string;
    loop: string;
    position: string;
    /** The heads of the table of events. */
    time: string;
    event: string;
    /**
     * A length of time as it is said aloud (a clock such as `0:12` is read as a time of day in Japanese): under a minute, under an hour and an hour or more.
     * `{h}`, `{m}` and `{s}` are the plain numbers and `{mm}` and `{ss}` the two-digit ones.
     */
    spokenSeconds: string;
    spokenMinutes: string;
    spokenHours: string;
    /** The value of the position slider: {t} of {total}. */
    positionValue: string;
    /** What the replay is and the keys it answers to, in smooth motion and in steps. */
    keys: string;
    keysStep: string;
    region: string;
  };
  /** The words of the 3D view: its name, the keys, the viewpoints, the controls, what is announced, and the names of what stands on the surface. */
  turn: {
    /** What the view is called, for a screen reader's role description, and the name of its row of controls. */
    region: string;
    group: string;
    /** What the view is and the keys it answers to. */
    keys: string;
    /** The four viewpoints. */
    overhead: string;
    broadcast: string;
    end: string;
    corner: string;
    /** The other controls. */
    reset: string;
    turnLeft: string;
    turnRight: string;
    raise: string;
    lower: string;
    zoomIn: string;
    zoomOut: string;
    /** The auto-turn: the button's name (its state is `aria-pressed`), what its tooltip says to press for, and what is announced when it starts and stops. */
    play: string;
    playOn: string;
    playOff: string;
    announcePlay: string;
    announcePause: string;
    /** The Reverse button's name (pressed while the auto-turn goes clockwise), what it is for, and what is announced when the direction changes. */
    reverse: string;
    reverseLabel: string;
    announceClockwise: string;
    announceCounterclockwise: string;
    /** What is announced after a key or a button: {name} for a viewpoint, and the angles: {yaw} and {pitch} in degrees. */
    announce: string;
    announceAngle: string;
    /** The sentence when the 3D view cannot be drawn and the flat drawing is shown. */
    flat: string;
    /** The sentence about what stands on the surface: {list}. */
    standing: string;
    /** One item of that list: {name} {h}; and a net with a lower height at its middle: {name} {h} {low}. */
    item: string;
    itemSag: string;
    /** The names of what stands on the surface, by kind. */
    parts: Record<"scoreboard" | "net" | "antennae" | "goalposts" | "netposts" | "hoop" | "goal" | "boards" | "stumps" | "pylons" | "flags" | "fence" | "backstop" | "foul-poles" | "table-legs" | "walls" | "starting-blocks" | "backstroke-flags" | "false-start-rope" | "springboards" | "platforms" | "judges-stand" | "hurdles" | "steeplechase" | "high-jump" | "pole-vault" | "cage" | "padding" | "rink-boards" | "mound" | "azuchi" | "targets" | "stands" | "wall-seats" | "roof" | "gallery" | "dais" | "banner" | "shrine" | "mat-edge" | "surrounds" | "officials" | "judges" | "deck" | "cage-fence" | "cage-posts" | "ring-ropes" | "ring-posts" | "ribbon-boards" | "hung-board" | "blocks", string>;
  };
  /** The names of the zones that `zoneAt` answers with (rules.ts), by id. */
  rules: Record<RuleId, string>;
  /** The words of the rules that FIBA's rule book says another way than the NBA's, for a court of `league: "fiba"`: the restricted area is the no-charge semicircle. */
  rulesFiba: Partial<Record<RuleId, string>>;
  /** The words of the targets seen end-on (target.ts): the goals, the stumps and the strike zone. */
  target: {
    sports: Record<"nhl" | "soccer" | "handball" | "waterpolo" | "lacrosse" | "fieldhockey" | "cricket" | "mlb", string>;
    /** Titles ({name}) and descriptions ({name} {w} {h} {unit}; {w} {bottom} {top} {side}). */
    titleGoal: string;
    descGoal: string;
    titleStrike: string;
    descStrike: string;
    titleStumps: string;
    descStumps: string;
    left: string;
    right: string;
    units: Record<"m" | "ft" | "in" | "cm" | "yd", string>;
    /** What became of a shot, a pitch or a delivery. */
    outcomes: Record<string, string>;
    /** The zones, by id. */
    zones: Record<string, string>;
    /** The length zones of a delivery, by id. */
    lengths: Record<string, string>;
    pitches: string;
    deliveries: string;
    numbers: string;
  };
}

/** The languages the words are in. */
const LANGUAGES: readonly Language[] = ["en", "ja"];

/**
 * The words of the package, by language. Each language is a file of its own (`strings.en.ts`, `strings.ja.ts`), and an entry holds the languages it was given: every entry but the lean district imports `strings.ts`, which holds both, as it always
 * did; the lean district (`district-lean`) holds none until `loadStrings(language)` has read the language it is about to draw in. Reading a language that is not held throws, naming the call that holds it.
 */
export const KYOGIJO_STRINGS: Record<Language, KyogijoWords> = Object.defineProperties(
  {} as Record<Language, KyogijoWords>,
  Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      {
        enumerable: true,
        configurable: true,
        get(): KyogijoWords {
          throw new Error(`the ${language === "en" ? "English" : "Japanese"} words are not read yet: await loadStrings("${language}") before the first draw in ${language}, or use an entry that holds both languages (the main entry, or any but the lean district's)`);
        },
      },
    ]),
  ),
);

/** Hold a language's words for the drawing: what `strings.en.ts` and `strings.ja.ts` do when they are read. After it `KYOGIJO_STRINGS[language]` is the words themselves. */
export function provideStrings(language: Language, words: KyogijoWords): void {
  Object.defineProperty(KYOGIJO_STRINGS, language, { value: words, enumerable: true, configurable: true, writable: true });
}

/** Whether a language's words are held. */
export const hasStrings = (language: Language): boolean => {
  const held = Object.getOwnPropertyDescriptor(KYOGIJO_STRINGS, language);
  return held !== undefined && held.get === undefined;
};

const reading = new Map<Language, Promise<void>>();

/**
 * The words of a language, read from the file of that language (the first time) and held for the drawing: await it before the first call of the lean district that draws in the language, and again when the language changes (a language
 * whose words are held is not read twice, and asking again gives the same promise). The entries that hold both languages need no call, and it does nothing there. A language there is no file for rejects.
 * @example
 * ```ts
 * import { drawDistrict, loadStrings, loadVenueDataFor } from "@johnmorrisdotca/kyogijo-stadiums/district-lean";
 * const venues = ["rogers-arena"];
 * await Promise.all([loadVenueDataFor(venues), loadStrings("ja")]);
 * console.log(drawDistrict({ venues, language: "ja" }).includes("ロジャーズ"));
 * // true
 * ```
 */
export function loadStrings(language: Language): Promise<void> {
  if (hasStrings(language)) return Promise.resolve();
  const found = reading.get(language);
  if (found !== undefined) return found;
  const promise: Promise<void> =
    language === "en" ? import("./strings.en.ts").then(() => undefined)
    : language === "ja" ? import("./strings.ja.ts").then(() => undefined)
    : Promise.reject(new Error(`no words in ${JSON.stringify(language)}: the languages are ${LANGUAGES.join(", ")}`));
  reading.set(language, promise);
  promise.catch(() => reading.delete(language));
  return promise;
}

/** Fill {placeholders} in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
