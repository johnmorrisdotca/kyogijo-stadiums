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
    stadiumHall: string;
    stadiumRingBuilding: string;
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

/** The words of the package, by language. */
export const KYOGIJO_STRINGS: Record<Language, KyogijoWords> = {
  en: {
    surface: { skating: "Skating rink", nfl: "NFL football field", cfl: "CFL football field", ifaf: "IFAF football field", nhl: "NHL hockey rink", nba: "NBA basketball court", mlb: "Baseball field", soccer: "Soccer pitch", curling: "Curling sheet", tennis: "Tennis court", volleyball: "Volleyball court", badminton: "Badminton court", pickleball: "Pickleball court", tabletennis: "Table tennis table", padel: "Padel court", squash: "Squash court", racquetball: "Racquetball court", sepaktakraw: "Sepak takraw court", teqball: "Teqball court", roundnet: "Roundnet court", netball: "Netball court", lacrosse: "Lacrosse field", rugby: "Rugby union field", afl: "Australian football ground", gaelic: "Gaelic football field", cricket: "Cricket ground", fieldhockey: "Field hockey pitch", handball: "Handball court", swimming: "Swimming pool", waterpolo: "Water polo field", diving: "Diving well", artisticswimming: "Artistic swimming pool", athletics: "Athletics track", judo: "Judo contest area", karate: "Karate competition area", kendo: "Kendo shiai-jo", sumo: "Sumo dohyō", kyudo: "Kyūdō range", dojo: "Dojo", mma: "MMA cage", boxing: "Boxing ring", wrestling: "Wrestling mat", prowrestling: "Professional wrestling ring" },
    about: {
      nfl: "an American football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts",
      cfl: "a Canadian football field, 150 by 65 yards with its 20-yard end zones, with a yard line every 5 yards, hash marks, numbers and goal posts on the goal lines",
      ifaf: "an international (IFAF) football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts",
      nhl: "an ice hockey rink, 200 by 85 feet with rounded corners, with its red and blue lines, face-off circles, creases and goal nets",
      nba: "a basketball court, 94 by 50 feet, with its keys, three-point lines, free-throw circles and the centre circle",
      mlb: "a baseball field, with a 90-foot infield, the mound, the foul lines and the outfield fence",
      soccer: "a soccer pitch, {length} by {width} metres, with the halfway line, the centre circle, both penalty areas, goal areas, penalty marks and arcs, the corner arcs and the goals",
      curling: "a curling sheet, {size}, with a house at each end (the 12-, 8- and 4-foot circles round the button), the tee, back, hog and centre lines and the hacks",
      tennis: "a tennis court, 78 by 36 feet, with its baselines, singles and doubles sidelines, service lines, centre service lines, centre marks and the net",
      volleyball: "a volleyball court, 18 by 9 metres, with its centre line, attack lines, the net and its antennae",
      badminton: "a badminton court, 13.4 by 6.1 metres, with its singles and doubles lines, short and long service lines, centre lines and the net",
      pickleball: "a pickleball court, 44 by 20 feet, with its non-volley zones, centre lines and the net",
      tabletennis: "a table tennis table, 2.74 by 1.525 metres, with its side lines, end lines, centre line and the net",
      padel: "a padel court, 20 by 10 metres, with its service lines, central service lines, the net, and the walls and metal fence of its enclosure",
      squash: "a squash court, 9.75 by 6.4 metres, with its short line, half court line and service boxes, the front wall laid flat beside it with its tin, service line and front wall line, and the walls round it",
      racquetball: "a racquetball court, 40 by 20 feet, with its short line, service line, service boxes, drive serve lines and broken receiving line, and the walls round it",
      sepaktakraw: "a sepak takraw court, 13.4 by 6.1 metres, with its centre line, quarter circles, service circles and the net",
      teqball: "a teqball court, 16 by 12 metres at the least, with the table and its net in the middle, the halfway line, the service lines and the court surrounds",
      roundnet: "a roundnet court, 10 by 10 metres at the least, with the set at its centre, the no hit zone line, the serving line and its four service positions",
      netball: "a netball court, 30.5 by 15.25 metres, with its transverse lines, centre circle, goal circles and goalposts",
      lacrosse: "a lacrosse field, with its end lines, goals, creases, restraining lines, wing lines and the centre line",
      rugby: "a rugby union field, 94 to 100 metres between the try lines and 68 to 70 metres wide, with its in-goal areas, the 22-metre lines, the half-way line, the dash lines and the goal posts",
      afl: "an Australian football ground, an oval 135 to 185 metres long and 110 to 155 metres wide, with the goal squares, the centre square and circles, the fifty metre arcs, and the goal posts and behind posts",
      gaelic: "a field for Gaelic football and hurling, 130 to 145 metres by 80 to 90 metres, with its lines across at 13, 20 and 45 metres, the two rectangles at each end, the arcs and the goalposts",
      cricket: "a cricket ground, with its boundary, the 30-yard circle, and the 22-yard pitch with its creases and wickets",
      fieldhockey: "a field hockey pitch, 91.40 by 55.00 metres, with the centre line, the 23-metre lines, the circles, the penalty spots and the goals",
      handball: "a handball court, 40 by 20 metres, with the centre line, the goal areas, the 6-, 7- and 9-metre lines, the 4-metre lines and the goals",
      swimming: "a swimming pool, 50 by 25 metres, with eight lanes, lane ropes, the lane markings on the floor, starting blocks, touch panels, backstroke flags and a false start rope",
      waterpolo: "a water polo field of play, 25 by 20 metres, with the goal lines, the 2, 5 and 6 metre marks, the half distance line, the goals and the re-entry areas",
      diving: "a diving well, with springboards at 1 and 3 metres and platforms at 5, 7.5 and 10 metres",
      artisticswimming: "an artistic swimming area, 30 by 20 metres, with the lines on the floor, the judges' platform and the starting platform",
      athletics: "an athletics track of 400 metres with eight lanes, the finish line and the lane numbers, with a soccer pitch inside it",
      skating: "a speed skating track of 400 metres with two lanes, the warm-up lane, the blocks of the curves and the finishing line",
      judo: "a judo contest area of 10 by 10 metres in a safety area 4 metres wide, laid with tatami of 2 by 1 metres",
      karate: "a karate kumite area: a matted square of 8 metres with its outer metre in another colour, in a safety area 2 metres wide",
      kendo: "a kendo shiai-jo of 10 by 10 metres with a wooden floor, white boundary lines and the two kaishi-sen",
      sumo: "a sumo dohyō: a clay square of 6.7 metres with a ring of 4.55 metres made of 20 tawara",
      kyudo: "a kyūdōjō for kinteki: a shajō with five shooting positions, 28 metres from the targets at the azuchi",
      dojo: "a dojo of 20 jō of tatami",
      mma: "an MMA cage: an eight-sided fenced area 9.14 metres (30 feet) across, on a platform 122 centimetres high",
      boxing: "a boxing ring: a square of 6.1 metres (20 feet) inside the ropes, on a platform 122 centimetres high",
      wrestling: "a wrestling mat of the UWW: a circle 9 metres across in a protection area 1.5 metres wide, with an orange passivity band inside the circle, on a platform 1 metre high",
      prowrestling: "a professional wrestling ring: a square of 6.1 metres (20 feet) inside three ropes, on a platform 102 centimetres high",
    },
    status: { final: "Final", "final-ot": "Final/OT", "final-so": "Final/SO", "final-aet": "Final/AET", "final-pens": "Final/Pens", live: "Live", half: "Halftime", "extra-time": "Extra time", "extra-end": "Extra end", penalties: "Penalties", postponed: "Postponed", tiebreak: "Tiebreak", "match-tiebreak": "Match tiebreak", retired: "Retired", walkover: "Walkover" },
    endStatus: "End {n}",
    setStatus: "Set {n}",
    gameStatus: "Game {n}",
    soccer: { futsal: "Futsal court", aboutFutsal: "a futsal court, {length} by {width} metres, with the halfway line, the centre circle, both penalty areas, the penalty marks and the goals", half: "Half of it is shown." },
    league: {
      basketball: "a basketball court, {size}, with its keys, three-point lines, free-throw circles and the centre circle",
      hockey: "an ice hockey rink, {size} with rounded corners, with its red and blue lines, face-off circles, creases and goal nets",
      football: "a football field, {size} with its end zones, with its yard lines, hash marks, numbers and goal posts",
      baseball: "a baseball field, with {base}-foot bases, the pitcher {pitch} feet from home plate, the foul lines and the outfield fence",
      softball: "a softball field, with {base}-foot bases, the pitcher {pitch} feet from home plate, the foul lines and the outfield fence",
      curling: "a curling sheet, {size}, with a house at each end (the 12-, 8- and 4-foot circles round the button), the tee, back, hog and centre lines and the hacks",
      tennis: "a tennis court, {size}, with its baselines, singles and doubles sidelines, service lines, centre service lines, centre marks and the net",
      volleyball: "a volleyball court, {size}, with its centre line, attack lines, the net and its antennae",
      beachVolleyball: "a beach volleyball court, {size}, with its boundary lines, the net and its antennae, and no centre line",
      badminton: "a badminton court, {size}, with its singles and doubles lines, short and long service lines, centre lines and the net",
      pickleball: "a pickleball court, {size}, with its non-volley zones, centre lines and the net",
      tabletennis: "a table tennis table, {size}, with its side lines, end lines, centre line and the net",
      sittingVolleyball: "a sitting volleyball court, {size}, with its centre line, attack lines, the net and its antennae",
      padel: "a padel court, {size}, with its service lines, central service lines, the net, and the walls and metal fence of its enclosure",
      squash: "a squash court, {size}, with its short line, half court line and service boxes, the front wall laid flat beside it with its tin, service line and front wall line, and the walls round it",
      racquetball: "a racquetball court, {size}, with its short line, service line, service boxes, drive serve lines and broken receiving line, and the walls round it",
      sepaktakraw: "a sepak takraw court, {size}, with its centre line, quarter circles, service circles and the net",
      teqball: "a teqball court, {size} at the least, with the table and its net in the middle, the halfway line, the service lines and the court surrounds",
      roundnet: "a roundnet court, {size} at the least, with the set at its centre, the no hit zone line, the serving line and its four service positions",
      netball: "a netball court, {size}, with its transverse lines, centre circle, goal circles and goalposts",
      lacrosse: "a lacrosse field, {size}, with its goals, creases and lines",
      lacrosseBox: "a box lacrosse floor with rounded corners, {size}, with its goals, creases, restraining lines and face-off circle",
      rugby: "a rugby union field, {size} with its in-goal areas, with the 22-metre lines, the half-way line, the dash lines and the goal posts",
      rugbyLeague: "a rugby league field, {size} with its in-goal areas, with a line across the field every 10 metres and the goal posts",
      afl: "an Australian football ground, {size}, an oval with the goal squares, the centre square and circles, the fifty metre arcs, and the goal posts and behind posts",
      gaelic: "a field for Gaelic football, {size}, with its lines across, the two rectangles at each end, the 13 and 40 metre arcs, the penalty point and the goalposts",
      hurling: "a field for hurling, {size}, with its lines across (the 65 metre lines too), the two rectangles at each end, the 13 metre arcs and the goalposts",
      cricket: "a cricket ground, {size}, with its boundary, the pitch with its creases and wickets, and the fielding restriction's circle where the rules have one",
      fieldhockey: "a field hockey pitch, {size}, with the centre line, the 23-metre lines, the circles, the penalty spots and the goals",
      handball: "a handball court, {size}, with the centre line, the goal areas, the 6-, 7- and 9-metre lines, the 4-metre lines and the goals",
      athletics: "an athletics track, {size}, with its lanes, the finish line and the lane numbers",
      skating: "a skating rink, {size}, with its lines",
      size: "{length} by {width} {unit}",
      units: { ft: "feet", yd: "yards", m: "metres" },
    },
    ballpark: {
      heading: "Wall height",
      sections: { outfield: "Outfield wall", left: "Left field", leftCenter: "Left-centre", center: "Centre field", deadCenter: "Dead centre", rightCenter: "Right-centre", right: "Right field", leftToCenter: "Left to centre field", centerToRight: "Centre to right field", leftCorner: "Left field corner", rightCorner: "Right field corner" },
      unit: { ft: "ft", m: "m" },
      tiers: { under: "under {a} {unit}", between: "{a} to {b} {unit}", over: "{a} {unit} and over" },
      height: "{name} {height} {unit}",
      walls: "Wall heights: {list}.",
      quirks: "Features of the park: {list}.",
      kinds: {
        hillName: "Hill", hill: "{name}, a hill {width} {unit} wide", hillSlope: "{name}, a hill {width} {unit} wide, sloping at {slope} degrees",
        overhangName: "Overhang", overhang: "{name}, {depth} {unit} over the field",
        poleName: "Foul pole", flagpoleName: "Flagpole", pole: "{name}, {feet} {unit} from home plate",
        bullpen: "Bullpen", bullpenHome: "Home bullpen", bullpenVisitors: "Visitors' bullpen", bullpenItem: "{name}, {feet} {unit} from home plate",
        ivy: "Ivy on the wall", basket: "The basket along the top of the wall",
        backstop: "Backstop, {feet} {unit} behind home plate",
        dugoutHome: "Home dugout, on the {line} base line", dugoutVisitors: "Visitors' dugout, on the {line} base line", first: "first", third: "third",
      },
    },
    net: { serving: "{name} is serving.", bySet: "By set, {name}: {list}.", byGame: "By game, {name}: {list}.", gamePoints: "In the current game, {name} has {points}.", sets: "Sets", games: "Games", points: "Pts" },
    pool: {
      size: "{length} by {width} metres", lanes: "{n} lanes", laneOne: "1 lane",
      aboutSwimming: "a swimming pool, {size}, with {lanes}, lane ropes, the lane markings on the floor, starting blocks, touch panels, backstroke flags and a false start rope",
      aboutWarmUp: "a warm-up pool, {size}, with {lanes} and lane ropes",
      aboutWaterPolo: "a water polo field of play, {size}, with the goal lines, the 2, 5 and 6 metre marks, the half distance line, the goals and the re-entry areas",
      aboutDiving: "a diving well, {size}, with {boards}",
      aboutArtistic: "an artistic swimming area, {size}, with the lines on the floor, the judges' platform and the starting platform",
      boards: "springboards at 1 and 3 metres", platforms: "platforms at {list} metres", and: " and ", sep: ", ", last: " and ", deep: ", of which {size} is the deep part",
      venue: "A hall with {n} pools to scale: {list}.",
      section: "A side section shows the water {depth} metres deep, the starting blocks, the backstroke flags 5 metres from each end and the false start rope 15 metres from the starting end.",
      names: { competition: "Competition pool", diving: "Diving well", warmUp: "Warm-up pool", waterPolo: "Water polo pool", artistic: "Artistic swimming pool", seating: "Spectators" },
      lane: "Lane {lane}: {name}", abbr: " ({abbr})", place: "place {n}", medal: { gold: "gold medal", silver: "silver medal", bronze: "bronze medal" },
      status: { dq: "disqualified", dns: "did not start", dnf: "did not finish" },
      seed: "entry time {time}", time: "time {time}", reaction: "reaction time {rt}", splits: "splits {list}", record: "record {record}",
      pace: "The bars show the pace of each split, from the slowest split of the field to the fastest.", paceBar: "{time} for {metres} m",
      event: "{event}", joiner: ", ",
      chart: { title: "Split pace", summary: "{n} swimmers. The fastest split was {name}'s {time}.", fastest: "fastest", headLane: "Lane", headName: "Swimmer", headTime: "Time", headSplit: "Split", headPace: "Seconds per 100 m", headReaction: "Reaction", caption: "{event}: the splits of each swimmer, with the pace of each in seconds per 100 metres.", turn: "Turn", finish: "Finish", start: "Start", perHundred: "per 100 m" },
    },
    field: { aflScore: "{name} scored {goals} goals and {behinds} behinds.", gaelicScore: "{name} scored {goals} goals and {points} points.", cricketScore: "{name}: {runs} runs for {wickets} wickets in {overs} overs.", cricketInnings: "By innings, {name}: {list}.", inningsStatus: "Innings {n}", innings: "Inn", runs: "Runs", wickets: "Wkts", overs: "Ov", total: "Total" },
    skating: {
      longTrack: "a speed skating track of 400 metres, its inner lane and its outer lane, the inner curve of {radius} metres radius, the outer lane {outer} metres wide and the straights {straight} metres long, with the warm-up lane, the blocks of the curves and the finishing line",
      shortTrack: "a short track speed skating oval of 111.12 metres on a rink of {length} by {width} metres, with {tracks} tracks, seven blocks in each curve, the finishing line and the starting lines",
      figure: "a figure skating rink of {length} by {width} metres, with its boards",
      races: "Races marked: {list}.",
      furniture: "Beside the rink: {list}.",
      furnitureNames: { judges: "the judges", referee: "the referee", "technical-panel": "the technical panel", "kiss-and-cry": "the kiss and cry" },
      start: "A close-up of the start of the {race}.",
      finish: "A close-up of the finishing line.",
      data: {
        draw: "Pairs, {race}",
        results: "Results, {race}",
        replay: "Replay of the {race}",
        elements: "The elements of the programme",
        summaryDraw: "{n} skaters in the {race}, last pair: {last}.",
        summaryGrid: "{n} starters in the {race}.",
        summaryResults: "{winner} won the {race} in {time}.",
        summaryReplay: "{n} skaters skate the {race}.",
        summaryElements: "{n} elements on the ice, {who}.",
        columns: { place: "Place", pair: "Pair", lane: "Lane", skater: "Skater", country: "Country", time: "Time", splits: "Splits", laps: "Laps", note: "Note", element: "Element", kind: "Kind", order: "No." },
        pair: "Pair {n}",
        lanes: { inner: "inner lane", outer: "outer lane" },
        medals: { gold: "Gold", silver: "Silver", bronze: "Bronze" },
        split: "{d} m: {t} s",
        lap: "Lap {n}: {t} s",
        layers: { names: "Names", flags: "Flags", medals: "Places", splits: "Splits", elements: "Elements", paths: "Paths" },
        gun: "Start",
        finish: "{name} finishes in {time}",
        seconds: "s",
        metres: "m",
      },
    },
    athletics: {
      track400: "an athletics track of 400 metres with {lanes} lanes, its bends of 36.50 metres radius at the kerb and its straights of 84.39 metres, with the finish line and the lane numbers",
      track200: "a covered athletics track of 200 metres with {lanes} lanes, its banked bends of 17.205 metres radius at the kerb and its straights of 44.983 metres, with the finish line and the lane numbers",
      infieldPitch: "A soccer pitch lies inside the track.",
      infieldGrass: "Mown grass lies inside the track.",
      infieldNone: "Nothing lies inside the track.",
      events: "Field events marked: {list}.",
      races: "Races marked: {list}.",
      start: "A close-up of the start of the {race}.",
      finish: "A close-up of the finish line.",
      layout: "The {event}, drawn alone at a large scale.",
      waterJump: "The steeplechase's water jump is {where} the second bend.",
      inside: "inside",
      outside: "outside",
      lane: "lane {n}",
      ground: "{ground}, athletics track",
      data: {
        draw: "Lane draw, {race}",
        results: "Results, {race}",
        replay: "Replay of the {race}",
        marks: "{event}: the attempts",
        summaryDraw: "{n} athletes in the {race}, from lane {first} to lane {last}.",
        summaryResults: "{winner} won the {race} in {time}.",
        summaryMarks: "{n} attempts, the best {best} by {who}.",
        summaryReplay: "{n} athletes run the {race}.",
        columns: { place: "Place", lane: "Lane", athlete: "Athlete", country: "Country", time: "Time", reaction: "Reaction", splits: "Splits", note: "Note", distance: "Mark", round: "Round", valid: "Valid" },
        medals: { gold: "Gold", silver: "Silver", bronze: "Bronze" },
        reaction: "Reaction {t} s",
        split: "{d} m: {t} s",
        foul: "foul",
        best: "best mark",
        yes: "yes",
        no: "no",
        layers: { names: "Names", flags: "Flags", medals: "Places", splits: "Splits", reactions: "Reaction times", attempts: "Attempts", best: "Best mark" },
        gun: "Gun",
        finish: "{name} finishes in {time}",
        seconds: "s",
        metres: "m",
      },

    },
    scoreTitle: "{away} {awayScore}, {home} {homeScore}",
    said: { home: "home", away: "away", won: "{name} won.", tied: "The game is level.", park: "The outfield fence follows the figures published for {park}.", officially: "Its official name is {name}.", ground: "The pitch follows the size published for {ground}.", groundDefault: "No pitch size is published for {ground}, so the pitch has the international size of 105 by 68 metres.", arenaRink: "{arena}, hockey rink", arenaCourt: "{arena}, basketball court", arenaRinkAbout: "an ice hockey rink, {length} by {width} feet ({lengthM} by {widthM} metres) with rounded corners, with its red and blue lines, face-off circles, creases and goal nets", arenaCourtAbout: "a basketball court, {length} by {width} feet ({lengthM} by {widthM} metres), with its keys, three-point lines, free-throw circles and the centre circle", arenaSize: "The size is the one published for {arena}.", arenaUnknown: "The article says the rink of {arena} was shorter than the NHL's but gives no size, so the NHL's is drawn.", real: "The stands are a plausible bowl of {seats} seats in {tiers} tiers, fitted inside the outline of the building of {arena} from OpenStreetMap ((c) OpenStreetMap contributors); it is not the arena's plan.", realBuilding: "The rink lies along the building's long axis, which is an inference, and the arrow points north.", realMapped: "The rink lies as OpenStreetMap maps the ice, and the arrow points north.", realNone: "The rink's orientation is not known, so it is drawn east-west with north at the top.", stadium: "The stands are a plausible bowl of {seats} seats in {tiers} bowls, fitted inside the outline of the building of {stadium} from OpenStreetMap ((c) OpenStreetMap contributors); it is not the stadium's plan.", stadiumOpening: "The field lies along the opening in the roof, which is the size of the field, and the arrow points north.", stadiumBuilding: "The field lies along the building's long axis, which is an inference, and the arrow points north.", stadiumNone: "The field's orientation is not known, so it is drawn east-west with north at the top.", stadiumHall: "The stands are a plausible bowl of {seats} seats in {tiers} levels, fitted inside the outline of the building of {stadium} from OpenStreetMap ((c) OpenStreetMap contributors); it is not the hall's plan.", stadiumRingBuilding: "The ring is set along the building's long axis, which is an inference, and the arrow points north.", stadiumPitchPark: "The way home plate faces is worked out from the grass of the field OpenStreetMap maps, fitted to the published fence, and the arrow points north.", stadiumNonePark: "The way home plate faces is not known, so the field is drawn the way that fits the building, and no arrow points north.", stadiumPark: "The stands are the usual stands of a ballpark, each band as deep as its seats need, for {seats} seats, fitted inside the outline of the building of {stadium} from OpenStreetMap ((c) OpenStreetMap contributors); it is not the park's plan.", stadiumPitch: "The field lies as OpenStreetMap maps the pitch, and the arrow points north.", stadiumInfield: "The way home plate faces is worked out from the infield OpenStreetMap maps and the building's outline, and the arrow points north.", district: "A plan of {count} real venues at their real positions and orientations, from the outlines OpenStreetMap maps; {mode}.", districtNeighbours: "it is fitted close round the buildings", districtCity: "it keeps the real distances, with a grid of kilometres and a scale", districtCredit: "Credit:", districtOutside: "People outside: {percent} percent of the seats of the venues, {people} people, stand on the sidewalks, plazas and grounds round them, and none on a road.", era: "The markings are those of the {season} season.", hammer: "{name} has the hammer.", ends: "By end, {name}: {list}.", total: "Total", wonPens: "{name} won {a}-{b} on penalties.", pens: "{a}-{b} pens", on: "Drawn as", sep: ", ", stop: ".", colon: ": ", gap: " " },
    budo: {
      sides: { north: "north", south: "south", east: "east", west: "west" },
      judo: "a judo contest area of {contest} by {contest} metres in a safety area {safety} metres wide, laid with tatami of {tatami}",
      judoMany: "a judo competition area of {areas} contest areas of {contest} by {contest} metres, {gap} metres apart, each in a safety area {safety} metres wide, laid with tatami of {tatami}",
      judoKata: "a judo kata area of {contest} by {contest} metres in a safety area {safety} metres wide, laid with tatami of {tatami}",
      danger: "A red danger zone, one tatami wide, runs round the inside of each contest area.",
      platform: "The tatami lies on a platform one metre wider and longer than it.",
      start: "The tape that marks where the contestants start lies at the centre, {apart} metres apart.",
      officials: "The technical table is at the top.",
      tatami: "{length} by {width} metres",
      karate: "a karate kumite area: a matted square of {area} metres with its outer metre in another colour, in a safety area {safety} metres wide, with the two start mats",
      karateMany: "a karate kumite competition area of {areas} matted squares of {area} metres with their outer metre in another colour, {gap} metres apart, each in a safety area {safety} metres wide, with the two start mats",
      karateKata: "a karate kata area: a matted square of {area} metres in a safety area {safety} metres wide",
      karateOfficials: "The table, the referee and the four judges are marked.",
      kendo: "a kendo shiai-jo: a wooden floor of {side} by {side} metres with white boundary lines, the cross at the centre and the two kaishi-sen, and 1.5 metres kept clear outside it",
      sumo: "a sumo dohyō: a clay square of {platform} metres, {height} centimetres high, with a ring of {circle} metres made of {count} tawara, the sand of the jano-me and the two shikiri-sen",
      sumoBare: "a sumo dohyō: a clay square of {platform} metres, {height} centimetres high, with a ring of {circle} metres",
      tassels: "The four tassels of the roof are in the colours of the quarters: green east, red south, white west, black north.",
      kyudo: "a kyūdōjō for kinteki: a shajō with {n} shooting positions, {distance} metres from the targets at the azuchi, with the yamichi between them and the path for fetching the arrows beside it",
      kyudoEnteki: "a kyūdōjō for enteki: a shajō with {n} shooting positions, {distance} metres from the targets of 1 metre at the azuchi, with the yamichi between them and the path for fetching the arrows beside it",
      dojoTraditional: "a dojo of {jo} jō, {width} by {length} metres, laid with tatami of {mat} metres so that no four corners meet",
      dojoCompetition: "a dojo of {jo} jō, {width} by {length} metres, laid with tatami of {mat} metres in the colours of a contest area and its safety area",
      dojoChecker: "a dojo of {jo} jō, {width} by {length} metres, laid with tatami of {mat} metres in two tones that alternate",
      dojoBorder: "a dojo of {jo} jō, {width} by {length} metres, laid with tatami of {mat} metres with a border of another colour",
      dojoKamiza: "The kamiza is at the {side}.",
      dojoShinzen: "The shinzen, the shrine, is at the kamiza.",
      dojoDais: "A raised platform stands at the kamiza wall, the seat of honour.",
      dojoBanner: "A plain dark banner hangs on the kamiza wall.",
      dojoAreas: "{n} contest areas of 8 metres are marked on the floor.",
      dojoWalls: "It has walls with {doors} and {windows}.",
      mma: "an MMA cage: an eight-sided fenced area {width} metres across ({feet} feet), with a fence {fence} centimetres high and eight padded posts, {platform}",
      mmaPlatform: "on a platform {height} centimetres high",
      mmaFloor: "at floor level",
      mmaGates: "It has two gates, opposite each other.",
      mmaSteps: "Steps lead up to the platform at each gate.",
      boxing: "a boxing ring: a square of {size} metres ({feet} feet) inside four ropes, on a canvas with an apron {apron} centimetres wide beyond them and a padded post in each corner, {platform}",
      boxingPlatform: "on a platform {height} centimetres high",
      boxingFloor: "at floor level",
      boxingCorners: "The corners are red and blue for the two boxers and white for the neutral ones.",
      boxingSteps: "Three sets of steps lead up to the platform: one in each boxer's corner and one in a neutral corner.",
      wrestlingUww: "a wrestling mat of the UWW, for freestyle and Greco-Roman wrestling: a circle {circle} metres across in a protection area {border} metres wide, with an orange passivity band {band} metre wide inside the circle, {platform}",
      wrestlingFolk: "a folkstyle wrestling mat: a circle {feet} feet ({circle} metres) across in a matted area {border} feet wide, {platform}",
      wrestlingPlatform: "on a platform {height} metres high",
      wrestlingFloor: "on the floor of the hall",
      wrestlingCentre: "A circle {d} metres across marks the middle.",
      wrestlingLines: "Two parallel starting lines at the middle are closed at their ends by a green line and a red line.",
      prowrestling: "a professional wrestling ring: a square of {size} metres ({feet} feet) inside three ropes, on a canvas with an apron {apron} centimetres wide beyond them and a padded post in each corner, {platform}",
      prowrestlingRopes: "The three ropes are not tied together.",
      prowrestlingSteps: "Steel steps stand beside the platform at two corners.",
      board: {
        ippon: "Ippon", wazaari: "Waza-ari", yuko: "Yuko", shido: "Shido", senshu: "Senshu", chui: "Chui", points: "Points", kimarite: "Kimarite",
        techniques: { men: "Men", kote: "Kote", do: "Dō", tsuki: "Tsuki", hansoku: "Hansoku" },
        judoScore: "{name}: {list}.", karateScore: "{name}: {list}.", kendoScore: "{name}: {list}.", sumoScore: "{name} won by {kimarite}.",
      },
    },
    pageant: { carpet: "Each team's flag or logo is laid out large over its own part of the surface, as a carpet.", stage: "Each team's crest stands on a large round stage over its own part of the surface.", emblem: "An emblem is in the middle.", emblemNamed: "The {name} emblem is in the middle." },
    situation: {
      home: "the home team",
      away: "the visitors",
      homeShort: "HOME",
      awayShort: "AWAY",
      pp: "PP",
      en: "EN",
      delayed: "DEL PEN",
      shootout: "SO",
      gws: "GWS",
      sudden: "SD",
      powerPlay: "Power play: {team} have {a} skaters against {b}.",
      strength: "{a} skaters against {b}.",
      penaltyTime: "{clock} left on the penalty.",
      emptyNet: "{team} have pulled the goalkeeper, and the net is empty.",
      delayedPenalty: "A penalty to {team} is delayed.",
      shootoutScore: "Shootout after {n} rounds: {away} {awayGoals}, {home} {homeGoals}.",
      gwsScore: "Game winning shots after {n} rounds: {away} {awayGoals}, {home} {homeGoals}.",
      suddenDeath: "The rounds after the third are sudden death.",
      top: "Top",
      bottom: "Bottom",
      inning: "{half} of the {nth} inning.",
      inningOnly: "The {nth} inning.",
      halfOnly: "{half} of the inning.",
      noOuts: "No outs.",
      oneOut: "1 out.",
      outs: "{n} outs.",
      basesEmpty: "The bases are empty.",
      basesLoaded: "The bases are loaded.",
      runnersOn: "Runners on {list}.",
      bases: ["first", "second", "third"],
      and: " and ",
      count: "The count is {b} balls and {s} strikes.",
      downs: ["1st", "2nd", "3rd", "4th"],
      tag: "{ord} & {n}",
      tagGoal: "{ord} & Goal",
      down: "{ord} down.",
      downDistance: "{ord} and {n}.",
      downGoal: "{ord} and goal.",
      ballOwn: "The ball is on the offence's own {n}-yard line.",
      ballOpp: "The ball is on the defence's {n}-yard line.",
      ballMid: "The ball is at midfield.",
      placeOwn: "own {n}",
      placeOpp: "opponent's {n}",
      placeMid: "midfield",
      tagOwn: "OWN {n}",
      tagOpp: "OPP {n}",
      redZone: "The ball is in the red zone.",
      possession: "{team} have the ball.",
      driveLine: "Drive by {team}, from {from} to {to}: {result}.",
      driveNoResult: "Drive by {team}, from {from} to {to}.",
      results: { touchdown: "touchdown", "field-goal": "field goal", "missed-field-goal": "missed field goal", punt: "punt", turnover: "turnover", interception: "interception", fumble: "fumble", downs: "turnover on downs", safety: "safety", "end-of-half": "end of the half" },
    },
    special: {
      guest: { skating: "rink", nfl: "football field", cfl: "football field", ifaf: "football field", nhl: "rink", nba: "court", mlb: "baseball field", soccer: "pitch", curling: "sheet", tennis: "court", volleyball: "court", badminton: "court", pickleball: "court", tabletennis: "table", padel: "court", squash: "court", racquetball: "court", sepaktakraw: "court", teqball: "court", roundnet: "court", netball: "court", lacrosse: "field", rugby: "field", afl: "ground", gaelic: "field", cricket: "ground", fieldhockey: "pitch", handball: "court", swimming: "pool", waterpolo: "pool", diving: "well", artisticswimming: "pool", athletics: "track", judo: "contest area", karate: "competition area", kendo: "shiai-jo", sumo: "dohyō", kyudo: "range", dojo: "dojo", mma: "cage", boxing: "ring", wrestling: "mat", prowrestling: "ring" },
      title: "{guest} in {host}",
      game: "{event}, {date}.",
      inside: "The {guest} lies wholly inside the outline of {host}.",
      hangs: "Part of the {guest}, {pct} percent of its area, lies outside the outline of {host}.",
      foul: "A ballpark's outline is the fair ground inside the fence, so a surface over the infield reaches into foul ground.",
      unnamed: { field: "the football field", pitch: "the pitch", deck: "the deck" },
      published: "Where it stands follows the sources: {note}",
      convention: "No source gives exactly where it stands, so it is placed by convention: {rule}",
      rules: {
        infield: "its middle on the middle of the infield, where the line from first base to third crosses the line from home plate to second, and its length across the field from first base to third.",
        midfield: "its middle on the middle of the field, and its length along the field.",
        diamond: "the middle of the infield on the middle of the pitch, and the line from home plate to centre field along the pitch.",
        deck: "its middle on the middle of the deck, and its length along the deck.",
      },
      months: "January,February,March,April,May,June,July,August,September,October,November,December",
      date: "{month} {day}, {year}",
      and: " and ",
    },
    charts: {
      titleNba: "NBA shot chart", titleNhl: "NHL shot map", titleMlb: "Baseball spray chart", titleNfl: "NFL pass chart", titleSoccer: "Soccer shot map", titleGoal: "Goal mouth: where the shots crossed the goal line",
      titleCurling: "Curling stones", curlingEnd: "End {n}", curlingStone: "Stone", curlingCounting: "Counting stone", curlingShot: "Shot rock", curlingFrom: "{name}: {d} ft from the button", curlingNoteCounting: "counting", curlingNoteShot: "the shot rock",
      sumCurling: "{n} stones in play. {team} scores {points}.", sumCurlingBlank: "{n} stones in play. No one scores: the end is blanked.", curlingOut: "{n} out of play.",
      titleCurlingHeat: "Where the stones came to rest", curlingHeatStat: "Stones", sumCurlingHeat: "{n} stones in play: {house} in the house and {guards} in the free guard zone.", curlingHeatTeam: "Only {name}'s stones.", curlingHeatGuards: "Only the free guards.", curlingHeatHouse: "Only the stones in the house.",
      shots: "shots", passes: "passes", balls: "balls in play", ballsBeyond: "balls beyond the fence", lineOfScrimmage: "line of scrimmage", key: "Key",
      made: "Made", missed: "Missed", missedNet: "Off target", goal: "Goal", saved: "Saved", blocked: "Blocked", shot: "Shot", post: "Hit the post",
      single: "Single", double: "Double", triple: "Triple", homeRun: "Home run", out: "Out", complete: "Complete", incomplete: "Incomplete", touchdown: "Touchdown", interception: "Interception",
      sizeXg: "Size: xG", sizeNote: "The size of a mark shows its expected goals (xG).", xgTotal: "xG {n}",
      fgRate: "Field goals made, %", completionRate: "Completions, %", goalRate: "Goals, % of shots", xgStat: "Expected goals (xG)", hitRate: "Hits, % of balls in play",
      leagueNote: "The zones are coloured by how far they are above or below the league figure of {league} percent.",
      sumNba: "Shots {shots}, made {made} ({pct}%).", sumShots: "Shots {shots}, goals {goals}.", sumShotsXg: "Shots {shots}, goals {goals}, expected goals (xG) {xg}.",
      sumMlb: "Balls in play {balls}: {list}.", sumNfl: "Passes {passes}, complete {complete} ({pct}%), touchdowns {td}, interceptions {int}.",
      beyondNote: "Beyond the fence: {n}.", airYards: "Air yards from {min} to {max}.",
      goalDesc: "The goal frame, {w} by {h} metres, seen from the front: the shooter's left is on the left.",
      titlePassNetwork: "Pass network", sizeTouches: "Node size: touches", widthPasses: "Link width: passes", sumNetwork: "Passes {passes}, players {players}, links {links}.",
    },
    layers: {
      pointOne: "point", pointMany: "points", lineOne: "line", lineMany: "lines", arrowOne: "arrow", arrowMany: "arrows", textOne: "label", textMany: "labels",
      count: "{n} {noun}", item: "{name} {n}", listSep: ", ", outcomes: "By outcome: {list}.", teams: "By team: {list}.", values: "Values from {min} to {max}.", skipped: "{n} left out for want of a place.", data: "Data",
      tableNo: "No.", tableX: "x", tableY: "y", tableToX: "to x", tableToY: "to y", tablePath: "Path", tableValue: "Value", tableTeam: "Team", tableOutcome: "Outcome", tableNote: "Note", tableText: "Text",
      tableFrame: "Coordinates in {frame}, in {unit}.", tableMore: "The first {shown} of {total} rows.",
      heatTitle: "Heat map of {n} {noun}", hexTitle: "Hexagon map of {n} {noun}", zonesTitle: "Zone chart of {n} {noun}", contourTitle: "Density contours of {n} {noun}", legendTitle: "Legend: {name}",
      range: "{min} to {max}", heatNote: "{stat} in {n} cells, from {min} to {max}.", hexNote: "{stat} in {n} hexagons, from {min} to {max}.", zoneNote: "{stat} in {n} zones, from {min} to {max}.", contourNote: "{n} density contours; the peak is near {x}, {y}.",
      top: "Highest: {list}.", outside: "{n} outside the grid or the zones.",
      stat: { count: "Count", sum: "Sum", mean: "Mean", median: "Median", percent: "Share of all, %", max: "Highest", min: "Lowest", rate: "Success rate, %", custom: "Value", density: "Density, share of the peak, %", mass: "Share of the data inside, %" },
      tableZone: "Zone", tableCount: "Count", tableShare: "Share, %", tableLevel: "Level", tableCell: "Cell", tableCells: "{stat}. Centres of the cells in {frame}, in {unit}.", tableCellsPlain: "{stat}. Centres of the cells, in {unit}.", valueItem: "{name} ({n})",
      zones: {
        pair: "{a}, {b}", atEnd: "{name} ({end})", endLeft: "left end", endRight: "right end", band: "band {n}", zone: "Zone {n}",
        wingLeft: "Left wing", halfLeft: "Left half-space", laneCentre: "Centre", halfRight: "Right half-space", wingRight: "Right wing",
        defensiveThird: "Defensive third", middleThird: "Middle third", attackingThird: "Attacking third",
        poolLane: "Lane {n}", poloGoalArea: "Goal area (to 2 m)", poloTwoToSix: "2 to 6 m from the goal line", poloBeyondSix: "Beyond 6 m", poolNear: "Near third", poolMiddle: "Middle third", poolFar: "Far third",
        restricted: "Restricted area", paint: "In the paint (non-RA)", midRange: "Mid-range", cornerLeft: "Left corner 3", cornerRight: "Right corner 3", aboveBreak: "Above the break 3",
        innerSlot: "Inner slot", outerSlot: "Outer slot", offensiveZone: "Offensive zone", behindGoalLine: "Behind the goal line", homePlate: "Home plate", outsideHomePlate: "Outside home plate",
        pull: "Pull", opposite: "Opposite", sprayCentre: "Centre", leftField: "Left field", centreField: "Centre field", rightField: "Right field", infield: "infield", outfield: "outfield",
        lengthShort: "Short", lengthDeep: "Deep", houseButton: "Button", houseFour: "4-foot ring", houseEight: "8-foot ring", houseTwelve: "12-foot ring", guardZone: "Free guard zone", frontCourt: "Front court", backCourt: "Back court", halfCourt: "Half court", outsideCircles: "Outside the circles", servingRing: "Serving ring", noHitZone: "No hit zone", sideLeft: "left", sideMiddle: "middle", sideRight: "right",
        pitchZone: "Pitch", insideCircle: "Inside the circle", outfieldGround: "Outfield",
        trackInfield: "Infield", homeStraight: "Finish straight", firstBend: "First bend", backStraight: "Back straight", secondBend: "Second bend", crossingStraight: "Crossing straight", firstCurve: "First curve", secondCurve: "Second curve", finishStraight: "Finish straight", rinkLeft: "Left end", rinkMiddle: "Middle", rinkRight: "Right end", budoContest: "Contest area", budoSafety: "Safety area", budoBand: "Boundary band", budoFloor: "Floor", budoClay: "Clay", budoJano: "Jano-me", budoRing: "Ring", budoShajo: "Shajō", budoYamichi: "Yamichi", budoAzuchi: "Azuchi", budoKamiza: "Kamiza end", budoRest: "The rest of the floor",
      },
    },
    team: {
      networkTitle: "Pass network: {players} players, {links} links from {passes} passes", networkNote: "Most touches: {name}, {touches}. Strongest link: {a} and {b}, {n} passes.", networkNoteDirected: "Most touches: {name}, {touches}. Strongest link: {a} to {b}, {n} passes.", networkMin: "Links of fewer than {n} passes are left out.",
      nodeTitle: "{name}: {touches} touches ({made} passes made, {received} received)", linkTitle: "{a} and {b}: {n} passes", linkTitleDirected: "{a} to {b}: {n} passes",
      formationTitle: "Formation {name}: {n} positions", formationNote: "Positions: {list}.", formationPlayers: "Players: {list}.", formationItem: "{who} ({position})",
      lineupTitle: "Lineup in {name}: {n} players", lineupCaptain: "Captain: {who}.", lineupRotation: "Rotation {n} of 6.", lineupUnplaced: "With no place in the formation: {list}.", captainTip: "Captain", captainMark: "C", tableCaptain: "Captain",
      voronoiTitle: "Space control of {n} players", voronoiNote: "Share of the surface nearest each team's players: {list}.", shareItem: "{name} {pct}%", voronoiShared: "{n} players share a place with another and have no cell.",
      delaunayTitle: "Delaunay triangulation of {n} players", delaunayNote: "{triangles} triangles and {edges} edges.",
      hullTitle: "Convex hull of {n} players", hullItem: "{name}: {n} players, area {area} {unit}", hullAll: "all players", squareUnits: { ft: "square feet", yd: "square yards", m: "square metres" }, squareOther: "square {unit}",
      flowTitle: "Flow of {n} movements in {cells} cells", flowNote: "The mean movement of a cell is up to {len} {unit} long.",
      sonarTitle: "Direction roses of {n} movements: {roses} roses of {angles} directions", sonarNote: "Most common direction: {deg} degrees, {n}.", sonarAngles: "0 degrees points to the right end of the surface as drawn wide and 90 degrees to the top.", roseTitle: "{name}: {n} movements, most toward {deg} degrees", barTitle: "{from} to {to} degrees: {value}",
      tablePlayer: "Player", tableFrom: "From", tableTo: "To", tablePasses: "Passes", tableMade: "Passes made", tableReceived: "Passes received", tableTouches: "Touches", tablePosition: "Position", tableNumber: "Number", tableName: "Name", tablePlayers: "Players", tableShare: "Share of the surface (%)", tableArea: "Area", tableCorners: "Corners", tableTriangles: "Triangles", tableEdges: "Edges", tableDirection: "Mean direction (degrees)", tableLength: "Mean length", tableSteady: "Steadiness (%)", tableFromAngle: "From (degrees)", tableToAngle: "To (degrees)", tableRose: "Rose",
      tableUnit: "Lengths in {unit}.",
    },
    notes: {
      home: "Home", away: "Away", attacking: "{team} attacking", left: "left", right: "right",
      attacks: "{team} attacks the {side} end.", attacksIn: "{team} attacks the {side} end in period {n}.",
      axesSurface: "Axes in the drawing's own numbers, in {unit}: x from {x0} to {x1}, y from {y0} to {y1}.",
      axesFrame: "Axes in the {frame} frame, in {unit}: x from {x0} to {x1}, y from {y0} to {y1}.",
      labelled: "Labelled parts: {list}.",
      names: {
        "end-zone": "End zone", "goal-line": "Goal line", "yard-line": "Yard line", midfield: "Midfield", "end-line": "End line", sideline: "Sideline", "hash-marks": "Hash marks", "yard-numbers": "Yard numbers", "goal-posts": "Goal posts", pylon: "Pylon",
        boards: "Boards", "blue-line": "Blue line", "face-off-circle": "Face-off circle", crease: "Crease", net: "Net", "centre-circle": "Centre circle", "centre-red-line": "Centre red line", trapezoid: "Trapezoid", "referee-crease": "Referee's crease",
        baseline: "Baseline", "halfway-line": "Halfway line", "half-court-line": "Halfway line", key: "Key", "free-throw-line": "Free-throw line", "free-throw-circle": "Free-throw circle", backboard: "Backboard", basket: "Basket", "three-point-line": "Three-point line", "restricted-area": "Restricted area",
        "home-plate": "Home plate", "first-base": "First base", "second-base": "Second base", "third-base": "Third base", "foul-line": "Foul line", "outfield-fence": "Outfield fence", "warning-track": "Warning track", "pitchers-plate": "Pitcher's plate", "batters-box": "Batter's box",
        touchline: "Touchline", "penalty-area": "Penalty area", "goal-area": "Goal area", "penalty-mark": "Penalty mark", "penalty-arc": "Penalty arc", "corner-arc": "Corner arc", goal: "Goal",
        "service-line": "Service line", "centre-service-line": "Centre service line", "singles-sideline": "Singles sideline", "centre-mark": "Centre mark", "attack-line": "Attack line", antenna: "Antenna", "back-boundary-line": "Back boundary line (the singles long service line)", "doubles-long-service-line": "Doubles long service line", "short-service-line": "Short service line", "non-volley-line": "Non-volley line", "non-volley-zone": "Non-volley zone", "court-net": "Net",
        "back-wall": "Back wall", "side-wall": "Side wall", "metal-fence": "Metal fence", "front-wall": "Front wall", tin: "Tin", "wall-service-line": "Service line (front wall)", "front-wall-line": "Front wall line", "short-line": "Short line", "squash-half-court-line": "Half-court line", "service-box": "Service box",
        "service-zone": "Service zone", "drive-serve-line": "Drive serve line", "receiving-line": "Receiving line", "safety-zone": "Safety zone", "quarter-circle": "Quarter circle", "service-circle": "Service circle", table: "Table", "court-surround": "Court surround",
        "roundnet-set": "Roundnet set", "no-hit-zone": "No hit zone", "service-position": "Service position", "transverse-line": "Transverse line", "goal-circle": "Goal circle", goalpost: "Goalpost", "goal-ring": "Goal ring",
        "hog-line": "Hog line", "tee-line": "Tee line", "back-line": "Back line", house: "House", button: "Button", "centre-line": "Centre line", hack: "Hack", "free-guard-zone": "Free guard zone",
        "try-line": "Try line", "dead-ball-line": "Dead-ball line", "twenty-two-line": "22-metre line", "ten-metre-line": "10-metre line", "forty-metre-line": "40-metre line", "in-goal": "In-goal",
        "boundary-line": "Boundary line", "behind-line": "Behind line", "goal-square": "Goal square", "centre-square": "Centre square", "fifty-metre-arc": "Fifty metre arc", "behind-posts": "Behind posts",
        "distance-line": "Distance line", "large-rectangle": "Large rectangle", "small-rectangle": "Small rectangle", "thirteen-metre-arc": "13 m arc", "forty-metre-arc": "40 m arc", "penalty-point": "Penalty point",
        boundary: "Boundary", pitch: "Pitch", "bowling-crease": "Bowling crease", "popping-crease": "Popping crease", "return-crease": "Return crease", wicket: "Wicket", "thirty-yard-circle": "30-yard circle",
        "twenty-three-line": "23-metre line", "shooting-circle": "Shooting circle", "penalty-spot": "Penalty spot", "broken-circle-line": "Broken line round the circle", "goal-area-line": "Goal-area line",
        "finish-line": "Finish line", kerb: "Kerb", "lane-lines": "Lane lines", bend: "Bend", straight: "Straight", "infield-pitch": "Soccer pitch", "start-line": "Start line", breakline: "Breakline", "water-jump": "Water jump", "exchange-zone": "Takeover zone",
        "referee-position": "Referee's place", "shiai-jo": "Shiai-jo", floorboard: "Floorboard", heri: "Heri, the mat's edge", "contest-area": "Contest area", "safety-area": "Safety area", "danger-zone": "Danger zone", "start-mark": "Start mark", "common-safe-zone": "Common safe zone", "free-zone": "Free zone", platform: "Platform", "technical-table": "Technical table", "centre-tape": "Centre tape", "kata-judges": "Judges, shomen side", "coach-chair": "Coach's chair", "kata-entry": "Entry and exit, opposite shomen", arena: "Arena floor", "competition-area": "Competition area", "boundary-band": "Boundary band", "start-mat": "Start mat", judge: "Judge", "between-areas": "Between the areas", "centre-cross": "Centre cross", "kaishi-sen": "Kaishi-sen", "outer-boundary": "Outer boundary", dohyo: "Dohyō", ring: "Ring", tawara: "Tawara", tokudawara: "Tokudawara", "shikiri-sen": "Shikiri-sen", "jano-me": "Jano-me", shajo: "Shajō", "shooting-position": "Shooting position", honza: "Honza", yamichi: "Yamichi", "yatori-michi": "Path for the arrows", azuchi: "Azuchi", mato: "Target", kamiza: "Kamiza", "cage-canvas": "Canvas", "cage-fence": "Fence", "cage-post": "Padded post", "cage-gate": "Gate", "cage-steps": "Steps", "cage-platform": "Platform", "ring-canvas": "Canvas", "ring-ropes": "Ropes", "ring-post": "Corner post", "ring-red-corner": "Red corner", "ring-blue-corner": "Blue corner", "ring-apron": "Apron", "ring-steps": "Steps", "ring-platform": "Platform", "mat-circle": "Wrestling area", "mat-central": "Central surface", "mat-border": "Border of the mat", "mat-passivity": "Passivity zone", "mat-centre-circle": "Centre circle", "mat-starting-lines": "Starting lines", "mat-platform": "Platform", shimoza: "Shimoza", shinzen: "Shinzen", dais: "Dais, the seat of honour", banner: "Banner", entrance: "Entrance", window: "Window", tatami: "Tatami", wall: "Wall", "inner-lane": "Inner lane", "outer-lane": "Outer lane", "crossing-straight": "Crossing straight", "warm-up-lane": "Warm-up lane", padding: "Padding", infield: "Infield", "coaches-area": "Coaches' area", blocks: "Blocks", "track-line": "Line of the track", "start-lines": "Starting lines", ice: "Ice", "technical-panel": "Technical panel", referee: "Referee", "kiss-and-cry": "Kiss and cry", judges: "Judges", runway: "Runway", "take-off-board": "Take-off board", "landing-area": "Landing area", "throwing-circle": "Throwing circle", sector: "Landing sector", "stop-board": "Stop board", cage: "Cage", "throwing-arc": "Throwing arc", crossbar: "Crossbar", "landing-mat": "Landing mat", "run-up": "Run-up", "zero-line": "Zero line", box: "Box",
        "seven-metre-line": "7-metre line", "four-metre-line": "4-metre line", "throw-off-area": "Throw-off area", "restraining-line": "Restraining line", "wing-line": "Wing line", "marking-area": "Marking area", "two-point-arc": "Two-point arc",
        "lane-rope": "Lane rope", "lane-line": "Lane marking on the floor", "lane-end-cross": "Cross line at the end of the lane marking", "fifteen-metre-mark": "15 m mark", "touch-pad": "Touch panel", "starting-block": "Starting block", "backstroke-flags": "Backstroke flags", "false-start-rope": "False start rope", gutter: "Gutter",
        "two-metre-line": "2 m line", "five-metre-mark": "5 m mark", "six-metre-line": "6 m line", "half-distance-line": "Half distance line", "re-entry-area": "Re-entry area", "referee-platform": "Referee platform", "official-table": "Official table", "substitution-area": "Substitution area",
        "springboard-1m": "1 m springboard", "springboard-3m": "3 m springboard", "platform-1m": "1 m platform", "platform-3m": "3 m platform", "platform-5m": "5 m platform", "platform-7-5m": "7.5 m platform", "platform-10m": "10 m platform", "diving-line": "Line across the well",
        "deep-part": "Deep part", "judges-platform": "Judges' platform", "starting-platform": "Starting platform", "floor-lines": "Lines on the floor",
      },
    },
    ranges: {
      shows: "Shows only the {name}.", showsEnd: "Shows only the {name} at the {side} end.",
      box: "Shows only a part of the surface: x from {x0} to {x1}, y from {y0} to {y1}.",
      boxFrame: "Shows only a part of the surface, in the {frame} frame: x from {x0} to {x1}, y from {y0} to {y1}.",
      cut: "Data outside it is not drawn.",
      names: {
        "red-zone": "red zone", "between-the-20s": "field between the 20-yard lines", "end-zone": "end zone", "field-of-play": "field of play", "own-half": "own half", "opponent-half": "opponent's half",
        "offensive-zone": "offensive zone", "defensive-zone": "defensive zone", "neutral-zone": "neutral zone", half: "half", "half-court": "half court", paint: "paint",
        "final-third": "final third", "defensive-third": "defensive third", "middle-third": "middle third", "penalty-area": "penalty area", infield: "infield", outfield: "outfield", sheet: "whole sheet", house: "house", folded: "whole sheet, folded",
        "in-goal": "in-goal area", "twenty-two": "area between the try line and the 22-metre line", twenty: "area between the goal line and the 20-metre line", crease: "crease", "forward-fifty": "area inside the fifty metre arc", "centre-square": "centre square",
        "large-rectangle": "large rectangle", pitch: "pitch", circle: "circle", "twenty-three": "23-metre area", "goal-area": "goal area",
        "pool-end": "end of the pool, up to the 15 m mark", springboards: "springboards", platforms: "platforms", "centre-stage": "centre of the pool, the middle third",
        "contest-area": "contest area", ring: "ring", shajo: "shajō", yamichi: "yamichi", azuchi: "azuchi", kamiza: "kamiza", cage: "cage", gate: "gate", ropes: "ring inside the ropes", corner: "corner", passivity: "passivity zone", "crossing-straight": "crossing straight", "first-bend": "first bend", "second-bend": "second bend", judges: "judges", "kiss-and-cry": "kiss and cry", bend: "bend", "home-straight": "finish straight", "back-straight": "back straight", finish: "finish line", start: "start", "high-jump": "high jump", "pole-vault": "pole vault", "long-jump": "long jump", "triple-jump": "triple jump", "shot-put": "shot put", "discus-throw": "discus throw", "hammer-throw": "hammer throw", "javelin-throw": "javelin throw", "water-jump": "water jump",
      },
      folded: {
        top: "Top house", bottom: "Bottom house", left: "Left house", right: "Right house",
        tall: "Shown folded: the whole sheet is in the middle, with its top house enlarged on the left and its bottom house enlarged on the right.",
        wide: "Shown folded: the whole sheet is in the middle, with its left house enlarged above it and its right house enlarged below it.",
        half: "Each enlarged part runs from the hog line to the back line.",
        house: "Each enlarged part is the house.",
        data: "Data is drawn in the enlarged parts as well.",
      },
    },
    grid: { title: "A grid of drawings ({n})", drawings: "Drawings ({n}): {list}.", key: "Key: {list}.", cell: "Drawing {n} of {total}", listSep: "; " },
    replay: {
      title: "Replay, {time}", objects: "{n} tracked objects", objectsOne: "{n} tracked object", events: "{n} events", eventsOne: "{n} event", players: "Players", others: "Ball, puck and officials", trail: "Trail of the last {s} seconds", numbers: "Shirt numbers", eventLines: "Passes and shots",
      home: "home", away: "away", ball: "ball", puck: "puck", official: "official", pass: "Pass", shot: "Shot", goal: "Goal", whistle: "Whistle",
      announce: "{what}, {time}", announceTeam: "{what}, {team}, {time}",
      group: "Replay controls", play: "Play", pause: "Pause", back: "Previous frame", forward: "Next frame", stepBack: "Back", stepForward: "Forward", speed: "Speed", loop: "Loop", position: "Position", time: "Time", event: "Event", spokenSeconds: "0:{ss}", spokenMinutes: "{m}:{ss}", spokenHours: "{h}:{mm}:{ss}", positionValue: "{t} of {total}",
      keys: "Replay of the play. Space plays or pauses, the left and right arrow keys step by a frame, Shift with an arrow key moves 5 seconds, and Home and End go to the ends.",
      keysStep: "Replay of the play, in steps. Space or the right arrow key moves on, the left arrow key goes back, and Home and End go to the ends.",
      region: "Replay",
    },
    turn: {
      region: "3D view", group: "Viewpoint",
      keys: "A 3D view you can turn. Drag, or use the arrow keys, to turn and tilt it; plus and minus zoom; 1 to 4 pick a viewpoint; 0 or Home puts it back; Space starts and stops the auto-turn. Pinch, or hold Ctrl and scroll, to zoom.",
      overhead: "Overhead", broadcast: "Broadcast", end: "End-on", corner: "Low corner",
      reset: "Reset the view", turnLeft: "Turn left", turnRight: "Turn right", raise: "Tip the surface away", lower: "Tip the surface toward you", zoomIn: "Zoom in", zoomOut: "Zoom out",
      play: "Auto-turn", playOn: "Start the auto-turn", playOff: "Pause the auto-turn", announcePlay: "Auto-turn on", announcePause: "Auto-turn paused", reverse: "Reverse", reverseLabel: "Turn the other way", announceClockwise: "Turning clockwise", announceCounterclockwise: "Turning counterclockwise",
      announce: "{name} view", announceAngle: "Turned to {yaw} degrees, seen from {pitch} degrees above the floor.",
      flat: "This browser cannot draw the 3D view, so the flat drawing is shown.",
      standing: "Standing on it, in the 3D view: {list}.", item: "{name} {h}", itemSag: "{name} {h} at the posts, {low} at the middle",
      parts: { scoreboard: "scoreboard (lower edge)", net: "net", antennae: "antennae", goalposts: "goal posts", netposts: "net posts", hoop: "baskets", goal: "goals", boards: "boards and glass", stumps: "stumps", pylons: "pylons", flags: "corner flags", fence: "fence", backstop: "backstop", "foul-poles": "foul poles", "table-legs": "table top", walls: "walls", "starting-blocks": "starting blocks", "backstroke-flags": "backstroke flags", "false-start-rope": "false start rope", springboards: "springboards", platforms: "platforms", "judges-stand": "judges' stand", hurdles: "hurdles", steeplechase: "steeplechase barriers", "high-jump": "high jump uprights and bar", "pole-vault": "pole vault uprights and bar", cage: "discus and hammer cage", padding: "padding", "rink-boards": "boards", mound: "clay mound", azuchi: "azuchi", targets: "targets", stands: "stands", "wall-seats": "seats on top of the wall", roof: "roof", gallery: "gallery", dais: "dais", banner: "banner", shrine: "shrine", "mat-edge": "mat thickness", surrounds: "surrounds", officials: "umpires' chairs and score tables", judges: "name cards on the judges' table", deck: "platform", "cage-fence": "fence", "cage-posts": "padded posts", "ring-ropes": "ropes", "ring-posts": "corner posts", "ribbon-boards": "LED ribbon boards", "hung-board": "centre-hung scoreboard", blocks: "surrounding buildings" },
    },
    rules: {
      "defensive-zone": "Defensive zone",
      "neutral-zone": "Neutral zone",
      "offensive-zone": "Offensive zone",
      "crease": "Crease",
      "trapezoid": "Goalkeeper's trapezoid",
      "behind-goal-line": "Behind the goal line",
      "inner-slot": "Inner slot",
      "outer-slot": "Outer slot",
      "slot": "Slot",
      "faceoff-circle": "Face-off circle",
      "centre-circle": "Centre circle",
      "frontcourt": "Frontcourt",
      "backcourt": "Backcourt",
      "restricted-area": "Restricted area",
      "paint": "Paint (the key)",
      "mid-range": "Mid-range",
      "corner-three-left": "Left corner three",
      "corner-three-right": "Right corner three",
      "above-the-break": "Above the break three",
      "three-point": "Three-point area",
      "defensive-third": "Defensive third",
      "middle-third": "Middle third",
      "attacking-third": "Attacking third",
      "six-yard-box": "Six-yard box (goal area)",
      "own-six-yard-box": "Own six-yard box",
      "penalty-area": "Penalty area",
      "own-penalty-area": "Own penalty area",
      "penalty-arc": "Penalty arc (the D)",
      "own-penalty-arc": "Own penalty arc",
      "wing-left": "Left wing",
      "half-space-left": "Left half-space",
      "central-corridor": "Central corridor",
      "half-space-right": "Right half-space",
      "wing-right": "Right wing",
      "infield": "Infield",
      "outfield": "Outfield",
      "fair-territory": "Fair territory",
      "foul-territory": "Foul territory",
      "over-the-wall": "Over the wall",
      "warning-track": "Warning track",
      "left-field": "Left field",
      "centre-field": "Centre field",
      "right-field": "Right field",
      "third-base-side": "Third-base side",
      "middle-infield": "Middle infield",
      "first-base-side": "First-base side",
      "own-end-zone": "Own end zone",
      "own-half": "Own half",
      "opponent-half": "Opponent's half",
      "red-zone": "Red zone",
      "opponent-end-zone": "Opponent's end zone",
      "end-zone": "End zone",
      "between-the-hashes": "Between the hashes",
      "outside-hashes-left": "Outside the hashes, left",
      "outside-hashes-right": "Outside the hashes, right",
    },
    rulesFiba: { "restricted-area": "No-charge semicircle" },
    target: {
      sports: {"nhl": "Hockey net", "soccer": "Soccer goal", "handball": "Handball goal", "waterpolo": "Water polo goal", "lacrosse": "Lacrosse goal", "fieldhockey": "Field hockey goal", "cricket": "Wicket", "mlb": "Strike zone"},
      titleGoal: "Goal mouth, {name}: where the shots crossed the goal line",
      descGoal: "The {name}, {w} by {h} {unit}, seen from the front: the shooter's left is on the left.",
      titleStrike: "Strike zone: where the pitches crossed the plate",
      descStrike: "The strike zone seen from the catcher's position: the plate {w} inches wide, the zone from {bottom} to {top} feet above the ground. The batter stands on the {side}.",
      titleStumps: "Stumps: where the deliveries reached the wicket",
      descStumps: "The stumps seen from the bowler's end: three stumps across 9 inches (22.86 cm) and 28 inches (71.12 cm) high, with the bails.",
      left: "left",
      right: "right",
      units: {"m": "metres", "ft": "feet", "in": "inches", "cm": "centimetres", "yd": "yards"},
      outcomes: {"goal": "Goal", "saved": "Saved", "post": "Post", "crossbar": "Crossbar", "wide": "Wide", "high": "High", "blocked": "Blocked", "shot": "Shot", "missed": "Missed", "ball": "Ball", "called-strike": "Called strike", "swinging-strike": "Swinging strike", "foul": "Foul", "in-play": "In play", "hit-by-pitch": "Hit by pitch", "wicket": "Wicket", "runs": "Runs", "dot": "Dot ball"},
      zones: {"top-left-corner": "Top left corner", "top-shelf": "Top shelf", "top-centre": "Top centre", "top-right-corner": "Top right corner", "mid-left": "Left side", "centre": "Centre", "mid-right": "Right side", "bottom-left-corner": "Bottom left corner", "five-hole": "Five-hole", "bottom-centre": "Bottom centre", "bottom-right-corner": "Bottom right corner", "wide-left": "Wide left", "wide-right": "Wide right", "over-the-bar": "Over the bar", "zone-1": "Zone 1", "zone-2": "Zone 2", "zone-3": "Zone 3", "zone-4": "Zone 4", "zone-5": "Zone 5", "zone-6": "Zone 6", "zone-7": "Zone 7", "zone-8": "Zone 8", "zone-9": "Zone 9", "zone-11": "Zone 11, high and left", "zone-12": "Zone 12, high and right", "zone-13": "Zone 13, low and left", "zone-14": "Zone 14, low and right", "outside": "Outside the zones", "outside-left": "Outside, left of the stumps", "on-stumps": "On the stumps", "over-stumps": "Over the stumps", "outside-right": "Outside, right of the stumps"},
      lengths: {"yorker": "Yorker length", "full": "Full length", "good-length": "Good length", "short-of-a-length": "Short of a length", "short": "Short"},
      pitches: "pitches",
      deliveries: "deliveries",
      numbers: "pitch numbers",
    },
  },
  // The Japanese of athletics and skating is each governing body's own word where its rule book has one (read 2026-10-14; the pages and files are in docs/references.md).
  // Athletics, 日本陸上競技連盟 競技規則 2026年度版 (JAAF; the World Athletics Technical Rules in Japanese) and 陸上競技場公認に関する細則:
  //   ボックス (pole vault, TR28.8), 踏切板 and 砂場 (long jump and triple jump, TR29.3 and TR30), 着地場所 and 着地場所の範囲 (the landing area of a throw, TR32.12; no 落下区域 or 有効区画 in the book),
  //   足留材 (a shot put's stop board, TR33.2), 囲い (the discus and hammer cage, TR35 and TR37), スターティング・ライン (the javelin's arc of 8 m, TR32.9: no 投てき弧), 助走路, ゼロライン (TR28),
  //   着地マット, 直走路 and 曲走路 (TR14.1), 第1曲走路 (TR17.5.1), バック・ストレート (TR17.5.1's note on the 800 m start), メイン側 (細則 第10条: the finishing straight, not ホームストレート),
  //   縁石, レーンライン, ブレイクライン (TR17.5.1), テーク・オーバー・ゾーン (細則 第10条), 水濠 and 障害物競走 (TR17.5.2: 3000m障害物競走), 1マイル, インフィールド (細則),
  //   200mトラック（ショート・トラック） (競技規則 第5部) and 室内陸上競技場 (細則).
  //   Television's words are aliases in docs/athletics.md: ホームストレート, コーナー, 落下区域, 有効区域, ストップボード, ケージ, 投てき弧, 障害, テイクオーバーゾーン, 室内200mトラック.
  // Skating, the Japanese translation of the ISU Special Regulations and Technical Rules Speed Skating (2018 edition, kept by the Aomori skating association: the Japan Skating Federation's own rule
  // books are not on the web) and the Federation's own teaching text (スピードスケート指導教本, 強化部) and viewing guide:
  //   インレーン and アウトレーン (Rules 253.3.1 and 254; the teaching text too), ウォームアップレーン (Rule 205), 交差ストレート and 交差エリア (Rules 203.2 and 254.5), フィニッシュ側ストレート (Rule 227.2),
  //   カーブ (not コーナー), ブロック and コーン (Rule 226), 防護マット (Rule 228.2), コーチエリア (Rule 227.3), プレ-スタートライン (Rule 227.2), 組, マススタート, チームパシュート, チームスプリント,
  //   トラック for a short track's tracks (the Federation's 大会要項: 標準ショートトラック), 直線 and カーブ (its guide: 直線28.85m, カーブの半径8m); the relays 3000mリレー, 5000mリレー and 2000m混合リレー
  //   (ISU Rule 281.1a; the JOC's usage). Television's インコース, アウトコース, バックストレート and ホームストレート are aliases in docs/skating.md. No rule book words were found for the figure skating
  //   furniture (ジャッジ席, テクニカルパネル, レフェリー, キス・アンド・クライ): they are the usual words.
  ja: {
    surface: { skating: "スケートリンク", nfl: "NFLのフィールド", cfl: "CFLのフィールド", ifaf: "IFAFのフィールド", nhl: "NHLのアイスホッケーリンク", nba: "NBAのバスケットボールコート", mlb: "野球場", soccer: "サッカーのピッチ", curling: "カーリングのシート", tennis: "テニスコート", volleyball: "バレーボールコート", badminton: "バドミントンコート", pickleball: "ピックルボールコート", tabletennis: "卓球台", padel: "パデルコート", squash: "スカッシュコート", racquetball: "ラケットボールコート", sepaktakraw: "セパタクローコート", teqball: "テックボールコート", roundnet: "ラウンドネットコート", netball: "ネットボールコート", lacrosse: "ラクロスのフィールド", rugby: "ラグビーユニオンのグラウンド", afl: "オーストラリアンフットボールのグラウンド", gaelic: "ゲーリック・フットボールのフィールド", cricket: "クリケットのグラウンド", fieldhockey: "フィールドホッケーのピッチ", handball: "ハンドボールのコート", swimming: "競泳プール", waterpolo: "水球のフィールド", diving: "飛込プール", artisticswimming: "アーティスティックスイミングのプール", athletics: "陸上競技のトラック", judo: "柔道の試合場", karate: "空手道の試合場", kendo: "剣道の試合場", sumo: "相撲の土俵", kyudo: "弓道場", dojo: "道場", mma: "総合格闘技のケージ", boxing: "ボクシングのリング", wrestling: "レスリングのマット", prowrestling: "プロレスのリング" },
    about: {
      nfl: "アメリカンフットボールのフィールド。エンドゾーンを含めて120×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      cfl: "カナディアンフットボールのフィールド。20ヤードのエンドゾーンを含めて150×65ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールライン上のゴールポストがあります",
      ifaf: "国際アメリカンフットボール連盟（IFAF）規格のフィールド。エンドゾーンを含めて120×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      nhl: "アイスホッケーのリンク。200フィート（約61m）×85フィート（約26m）で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります",
      nba: "バスケットボールのコート。94フィート（約28.7m）×50フィート（約15.2m）で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります",
      mlb: "野球場。塁間90フィート（約27.4m）の内野、マウンド、ファウルライン、外野フェンスがあります",
      soccer: "サッカーのピッチ。{length}×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティーエリアとゴールエリア、ペナルティーマークとペナルティーアーク、コーナーアーク、ゴールがあります",
      curling: "カーリングのシート。{size}で、両端にハウス（ボタンを囲む12フィート・8フィート・4フィートの円）があり、ティーライン、バックライン、ホッグライン、センターライン、ハックがあります",
      tennis: "テニスコート。78フィート（約23.8m）×36フィート（約11m）で、ベースライン、シングルスとダブルスのサイドライン、サービスライン、センターサービスライン、センターマーク、ネットがあります",
      volleyball: "バレーボールコート。18×9mで、センターライン、アタックライン、ネットとアンテナがあります",
      badminton: "バドミントンコート。13.4×6.1mで、シングルスとダブルスのライン、ショートサービスライン、ロングサービスライン、センターライン、ネットがあります",
      pickleball: "ピックルボールコート。44フィート（約13.4m）×20フィート（約6.1m）で、ノンボレーゾーン、センターライン、ネットがあります",
      tabletennis: "卓球台。2.74×1.525mで、サイドライン、エンドライン、センターライン、ネットがあります",
      padel: "パデルコート。20×10mで、サービスライン、センターサービスライン、ネット、囲いの壁と金網があります",
      squash: "スカッシュコート。9.75×6.4mで、ショートライン、ハーフコートライン、サービスボックスがあり、横に広げて描いた前壁にはティン、サービスライン、フロントウォールラインがあり、周囲に壁があります",
      racquetball: "ラケットボールコート。40フィート（約12.2m）×20フィート（約6.1m）で、ショートライン、サービスライン、サービスボックス、ドライブサーブライン、破線のレシービングラインがあり、周囲に壁があります",
      sepaktakraw: "セパタクローコート。13.4×6.1mで、センターライン、クォーターサークル、サービスサークル、ネットがあります",
      teqball: "テックボールコート。16×12m以上で、中央にテーブルとネット、ハーフウェーライン、サービスライン、コート周囲のエリアがあります",
      roundnet: "ラウンドネットコート。10×10m以上で、中央にセット（丸いネット）、ノーヒットゾーンの円、サーブの円、4か所のサーブ位置があります",
      netball: "ネットボールコート。30.5×15.25mで、トランスバースライン、センターサークル、ゴールサークル、ゴールポストがあります",
      lacrosse: "ラクロスのフィールド。エンドライン、ゴール、クリース、リストレイニングライン、ウイングライン、センターラインがあります",
      rugby: "ラグビーユニオンのグラウンド。トライライン間が94〜100m、幅が68〜70mで、インゴール、22メートルライン、ハーフウェイライン、破線、ゴールポストがあります",
      afl: "オーストラリアンフットボールのグラウンド。長さ135〜185m、幅110〜155mの楕円形で、ゴールスクエア、センタースクエアとサークル、50メートルアーク、ゴールポストとビハインドポストがあります",
      gaelic: "ゲーリック・フットボールとハーリング用のフィールド。130〜145m×80〜90mで、13m・20m・45mの横線、両端の2つの長方形、アーク、ゴールポストがあります",
      cricket: "クリケットのグラウンド。バウンダリー、30ヤードのサークル、クリースとウィケットのある22ヤードのピッチがあります",
      fieldhockey: "フィールドホッケーのピッチ。91.40×55.00mで、センターライン、23メートルライン、サークル、ペナルティースポット、ゴールがあります",
      handball: "ハンドボールのコート。40×20mで、センターライン、ゴールエリア、6m・7m・9mのライン、4mのライン、ゴールがあります",
      swimming: "競泳用のプール。50×25mで、8レーン、レーンロープ、床面のレーンライン、スタート台、タッチ板、背泳ぎ用フラッグ、フォルススタートロープがあります",
      waterpolo: "水球のフィールド。25×20mで、ゴールライン、2mライン、6mライン、5mの標識、ハーフライン、ゴール、退水者の再入水エリアがあります",
      diving: "飛込のプール。1mと3mの飛板、5m・7.5m・10mの固定台があります",
      artisticswimming: "アーティスティックスイミングの競技エリア。30×20mで、プール底のライン、ジャッジ台、スタート台があります",
      athletics: "陸上競技の400mトラック。8レーンで、フィニッシュラインとレーン番号があり、内側にサッカーのピッチがあります",
      skating: "400mのスピードスケートリンク。インレーンとアウトレーン、ウォームアップレーン、カーブのブロック、フィニッシュラインがあります",
      judo: "柔道の試合場。試合場内は10m四方、幅4mの安全地帯があり、2×1mの畳を敷いています",
      karate: "空手道の組手の試合場。一辺8mの正方形にマットを敷き、外側の1mは別の色で、幅2mの安全地帯があります",
      kendo: "剣道の試合場。10m四方の板張りで、白い境界線と2本の開始線があります",
      sumo: "相撲の土俵。一辺6.7mの粘土の正方形に、20俵でつくる直径4.55mの円があります",
      kyudo: "近的の弓道場。射位が5か所ある射場から、安土の的まで28mあります",
      dojo: "20畳の道場",
      mma: "総合格闘技のケージ。金網で囲まれた、対辺間の距離が30フィート（約9.1m）の八角形で、高さ122cmの台の上にあります",
      boxing: "ボクシングのリング。ロープの内側は一辺20フィート（約6.1m）の正方形で、リングは高さ122cmの台の上にあります",
      wrestling: "UWWのレスリングマット。直径9mの円の外側に幅1.5mのプロテクションエリアがあり、円の内側にオレンジ色のパッシビティゾーンがあります。マットは高さ1mの台の上にあります",
      prowrestling: "プロレスのリング。ロープの内側は一辺20フィート（約6.1m）の正方形で、リングは高さ102cmの台の上にあります",
    },
    status: { final: "試合終了", "final-ot": "試合終了（延長）", "final-so": "試合終了（SO）", "final-aet": "試合終了（延長戦）", "final-pens": "試合終了（PK戦）", live: "試合中", half: "ハーフタイム", "extra-time": "延長戦", "extra-end": "エキストラエンド", penalties: "PK戦", postponed: "延期", tiebreak: "タイブレーク", "match-tiebreak": "マッチタイブレーク", retired: "途中棄権", walkover: "不戦勝" },
    endStatus: "第{n}エンド",
    setStatus: "第{n}セット",
    gameStatus: "第{n}ゲーム",
    soccer: { futsal: "フットサルのコート", aboutFutsal: "フットサルのコート。{length}×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティーエリア、ペナルティーマーク、ゴールがあります", half: "半面のみ表示しています。" },
    league: {
      basketball: "バスケットボールのコート。{size}で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります",
      hockey: "アイスホッケーのリンク。{size}で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります",
      football: "アメリカンフットボールのフィールド。エンドゾーンを含めて{size}で、ヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      baseball: "野球場。塁間{base}フィート、投手板は本塁から{pitch}フィートで、ファウルライン、外野フェンスがあります",
      softball: "ソフトボール場。塁間{base}フィート、投手板は本塁から{pitch}フィートで、ファウルライン、外野フェンスがあります",
      curling: "カーリングのシート。{size}で、両端にハウス（ボタンを囲む12フィート・8フィート・4フィートの円）があり、ティーライン、バックライン、ホッグライン、センターライン、ハックがあります",
      tennis: "テニスコート。{size}で、ベースライン、シングルスとダブルスのサイドライン、サービスライン、センターサービスライン、センターマーク、ネットがあります",
      volleyball: "バレーボールコート。{size}で、センターライン、アタックライン、ネットとアンテナがあります",
      beachVolleyball: "ビーチバレーボールコート。{size}で、サイドライン、エンドライン、ネット、アンテナがあります。センターラインはありません",
      badminton: "バドミントンコート。{size}で、シングルスとダブルスのライン、ショートサービスライン、ロングサービスライン、センターライン、ネットがあります",
      pickleball: "ピックルボールコート。{size}で、ノンボレーゾーン、センターライン、ネットがあります",
      tabletennis: "卓球台。{size}で、サイドライン、エンドライン、センターライン、ネットがあります",
      sittingVolleyball: "シッティングバレーボールコート。{size}で、センターライン、アタックライン、ネット、アンテナがあります",
      padel: "パデルコート。{size}で、サービスライン、センターサービスライン、ネット、囲いの壁と金網があります",
      squash: "スカッシュコート。{size}で、ショートライン、ハーフコートライン、サービスボックスがあり、横に広げて描いた前壁にはティン、サービスライン、フロントウォールラインがあり、周囲に壁があります",
      racquetball: "ラケットボールコート。{size}で、ショートライン、サービスライン、サービスボックス、ドライブサーブライン、破線のレシービングラインがあり、周囲に壁があります",
      sepaktakraw: "セパタクローコート。{size}で、センターライン、クォーターサークル、サービスサークル、ネットがあります",
      teqball: "テックボールコート。{size}以上で、中央にテーブルとネット、ハーフウェーライン、サービスライン、コート周囲のエリアがあります",
      roundnet: "ラウンドネットコート。{size}以上で、中央にセット（丸いネット）、ノーヒットゾーンの円、サーブの円、4か所のサーブ位置があります",
      netball: "ネットボールコート。{size}で、トランスバースライン、センターサークル、ゴールサークル、ゴールポストがあります",
      lacrosse: "ラクロスのフィールド。{size}で、ゴール、クリース、各種のラインがあります",
      lacrosseBox: "角が丸いボックスラクロスのフロア。{size}で、ゴール、クリース、リストレイニングライン、フェイスオフサークルがあります",
      rugby: "ラグビーユニオンのグラウンド。インゴールを含めて{size}で、22メートルライン、ハーフウェイライン、破線、ゴールポストがあります",
      rugbyLeague: "ラグビーリーグのグラウンド。インゴールを含めて{size}で、10mごとの横線とゴールポストがあります",
      afl: "オーストラリアンフットボールのグラウンド。{size}の楕円形で、ゴールスクエア、センタースクエアとサークル、50メートルアーク、ゴールポストとビハインドポストがあります",
      gaelic: "ゲーリック・フットボールのフィールド。{size}で、横線、両端の2つの長方形、13mと40mのアーク、ペナルティーマーク、ゴールポストがあります",
      hurling: "ハーリングのフィールド。{size}で、65mの線を含む横線、両端の2つの長方形、13mのアーク、ゴールポストがあります",
      cricket: "クリケットのグラウンド。{size}で、バウンダリー、クリースとウィケットのあるピッチ、規則によっては守備制限のサークルがあります",
      fieldhockey: "フィールドホッケーのピッチ。{size}で、センターライン、23メートルライン、サークル、ペナルティースポット、ゴールがあります",
      handball: "ハンドボールのコート。{size}で、センターライン、ゴールエリア、6m・7m・9mのライン、4mのライン、ゴールがあります",
      athletics: "陸上競技のトラック。{size}で、レーン、フィニッシュライン、レーン番号があります",
      skating: "スケートリンク。{size}で、ラインがあります",
      size: "{length}×{width}{unit}",
      units: { ft: "フィート", yd: "ヤード", m: "m" },
    },
    ballpark: {
      heading: "フェンスの高さ",
      sections: { outfield: "外野フェンス", left: "左翼", leftCenter: "左中間", center: "中堅", deadCenter: "中堅正面", rightCenter: "右中間", right: "右翼", leftToCenter: "左翼から中堅", centerToRight: "中堅から右翼", leftCorner: "左翼のポール際", rightCorner: "右翼のポール際" },
      unit: { ft: "フィート", m: "m" },
      tiers: { under: "{a}{unit}未満", between: "{a}〜{b}{unit}", over: "{a}{unit}以上" },
      height: "{name} {height}{unit}",
      walls: "フェンスの高さ：{list}。",
      quirks: "球場の特徴：{list}。",
      kinds: {
        hillName: "丘", hill: "{name}（幅{width}{unit}の丘）", hillSlope: "{name}（幅{width}{unit}、傾斜{slope}度の丘）",
        overhangName: "張り出し席", overhang: "{name}（フィールド上に{depth}{unit}張り出し）",
        poleName: "ファウルポール", flagpoleName: "旗ざお", pole: "{name}（本塁から{feet}{unit}）",
        bullpen: "ブルペン", bullpenHome: "ホームのブルペン", bullpenVisitors: "ビジターのブルペン", bullpenItem: "{name}（本塁から{feet}{unit}）",
        ivy: "外野フェンスのツタ", basket: "フェンス上部の金網（バスケット）",
        backstop: "バックネット（本塁から{feet}{unit}）",
        dugoutHome: "ホームのダグアウト（{line}塁側）", dugoutVisitors: "ビジターのダグアウト（{line}塁側）", first: "一", third: "三",
      },
    },
    net: { serving: "{name}のサーブです。", bySet: "{name}のセットごとのスコア：{list}。", byGame: "{name}のゲームごとのスコア：{list}。", gamePoints: "現在のゲームのポイントは、{name}が{points}です。", sets: "セット", games: "ゲーム", points: "ポイント" },
    // The pools' words are the Japan Swimming Federation's (日本水泳連盟, rule books fetched from swim.or.jp, 2026-10-13), not translations of World Aquatics' English; where it has no word, the usual katakana stays:
    //   レーン, レーンロープ, タッチ板, スタート台, 15mマーク, 背泳ぎ用フラッグ ... 競泳競技規則 (2023-04-01), the checks of the pool, 16.2.7.1.1, 16.1.7.2, 16.1.10; 長水路 and 短水路, 12.1 and 12.2;
    //   途中時間 (the time at a split) ... 競泳競技規則 2.9.2, 11.3.2, 11.6; 棄権 and 失格 ... 競泳競技規則 3 and 11.
    //   床面のレーンライン, クロスライン (第22条, 第23条), 背泳ぎ用ターン標識 (第28条), タッチ板 (第29条), 飛込プールのレーンマーク (第87条), 飛板, 固定台, 競泳プール, 飛込プール, 水球プール ... プール公認規則 (2026-07-01).
    //   練習用プール, プール施設, 観客席 ... 公認プール施設要領 (2025-04-01).
    //   飛板 and 固定台 ... 飛込競技規則 (2026-04-01), 1.2, 3.7.3 (飛板飛込, 高飛込 are the events).
    //   フィールド, ハーフライン (definition 1.10), 2mライン and 6mライン, 標識 (18.3.1, where the 5 m mark is; 1.8 defines the 5mライン), ゴールエリア, 再入水エリア, 審判台 (18.3.2), オフィシャル席 (definition 1.2) ... 水球競技ハンドブック (2023-04-01), read again on 2026-10-14: those are its own numbers.
    //   ジャッジ台 (27.2.8), スタート台 (27.2.7), 競技エリア ... アーティスティックスイミング競技規則 (2026-04-23), read again on 2026-10-14: its own numbers, the same as World Aquatics' June 2025 edition (the February 2026 edition has 12.2.5 and 12.2.4).
    // No word in those books, so the common one stays: フォルススタートロープ (the false start rope is World Aquatics', not in the federation's books), 反応時間 (reaction time).
    // Everyday words the books do not use, kept as aliases in docs/pools.md: コース for a lane, バックストロークフラッグ, タッチパッド, スプリット and ラップ, スプリングボード, プラットフォーム, 水泳場.
    pool: {
      size: "{length}×{width}m", lanes: "{n}レーン", laneOne: "1レーン",
      aboutSwimming: "競泳用のプール。{size}で、{lanes}、レーンロープ、床面のレーンライン、スタート台、タッチ板、背泳ぎ用フラッグ、フォルススタートロープがあります",
      aboutWarmUp: "練習用のプール。{size}で、{lanes}とレーンロープがあります",
      aboutWaterPolo: "水球のフィールド。{size}で、ゴールライン、2mライン、6mライン、5mの標識、ハーフライン、ゴール、退水者の再入水エリアがあります",
      aboutDiving: "飛込のプール。{size}で、{boards}があります",
      aboutArtistic: "アーティスティックスイミングの競技エリア。{size}で、プール底のライン、ジャッジ台、スタート台があります",
      boards: "1mと3mの飛板", platforms: "{list}mの固定台", and: "、", sep: "、", last: "と", deep: "。うち{size}は深い部分です",
      venue: "{n}面のプールを縮尺どおりに並べたプール施設：{list}。",
      section: "断面図には、水深{depth}m、スタート台、両端から5mの位置の背泳ぎ用フラッグ、スタート側から15mの位置のフォルススタートロープが描かれています。",
      names: { competition: "競技用プール", diving: "飛込プール", warmUp: "練習用プール", waterPolo: "水球プール", artistic: "アーティスティックスイミングのプール", seating: "観客席" },
      lane: "第{lane}レーン：{name}", abbr: "（{abbr}）", place: "{n}位", medal: { gold: "金メダル", silver: "銀メダル", bronze: "銅メダル" },
      status: { dq: "失格", dns: "棄権（スタートせず）", dnf: "途中棄権" },
      seed: "エントリータイム{time}", time: "タイム{time}", reaction: "反応時間{rt}秒", splits: "途中時間{list}", record: "記録{record}",
      pace: "棒は各途中時間のペースを示し、出場者の中で最も遅いものから最も速いものまでを色で表しています。", paceBar: "{metres}mを{time}",
      event: "{event}", joiner: "、",
      chart: { title: "途中時間のペース", summary: "{n}人の選手。最も速い途中時間は{name}の{time}です。", fastest: "最速", headLane: "レーン", headName: "選手", headTime: "タイム", headSplit: "途中時間", headPace: "100mあたりの秒数", headReaction: "反応時間", caption: "{event}：各選手の途中時間と、100mあたりの秒数で表したペース。", turn: "ターン", finish: "フィニッシュ", start: "スタート", perHundred: "100mあたり" },
    },
    field: { aflScore: "{name}は{goals}ゴール{behinds}ビハインドです。", gaelicScore: "{name}は{goals}ゴール{points}ポイントです。", cricketScore: "{name}：{overs}オーバーで{runs}ラン（{wickets}ウィケット喪失）。", cricketInnings: "{name}のイニングごとのスコア：{list}。", inningsStatus: "第{n}イニング", innings: "イニング", runs: "ラン", wickets: "ウィケット", overs: "オーバー", total: "合計" },
    skating: {
      longTrack: "400mのスピードスケートリンク。インレーンとアウトレーンがあり、内側のカーブの半径は{radius}m、アウトレーンの幅は{outer}m、ストレートは{straight}mで、ウォームアップレーン、カーブのブロック、フィニッシュラインがあります",
      shortTrack: "1周111.12mのショートトラック。{length}m×{width}mのリンクに、{tracks}本のトラック、各カーブ7個のブロック、フィニッシュラインとスタートラインがあります",
      figure: "{length}m×{width}mのフィギュアスケートのリンク。フェンスがあります",
      races: "表示している種目：{list}。",
      furniture: "リンクのそばにあるもの：{list}。",
      furnitureNames: { judges: "ジャッジ席", referee: "レフェリー", "technical-panel": "テクニカルパネル", "kiss-and-cry": "キス・アンド・クライ" },
      start: "{race}のスタートの拡大図。",
      finish: "フィニッシュラインの拡大図。",
      data: {
        draw: "{race}の組み合わせ",
        results: "{race}の結果",
        replay: "{race}のリプレイ",
        elements: "プログラムのエレメント",
        summaryDraw: "{race}は{n}選手が出場し、最終組は第{last}組です。",
        summaryGrid: "{race}は{n}選手がスタートします。",
        summaryResults: "{race}は{winner}が記録{time}で優勝しました。",
        summaryReplay: "{race}を{n}選手が滑ります。",
        summaryElements: "氷上のエレメントは{n}個です：{who}。",
        columns: { place: "順位", pair: "組", lane: "レーン", skater: "選手", country: "国", time: "記録", splits: "スプリット", laps: "周回", note: "備考", element: "エレメント", kind: "種類", order: "順番" },
        pair: "第{n}組",
        lanes: { inner: "インレーン", outer: "アウトレーン" },
        medals: { gold: "金", silver: "銀", bronze: "銅" },
        split: "{d}m：{t}秒",
        lap: "{n}周目：{t}秒",
        layers: { names: "選手名", flags: "国旗", medals: "順位", splits: "スプリット", elements: "エレメント", paths: "軌跡" },
        gun: "スタート",
        finish: "{name}が{time}でフィニッシュ",
        seconds: "秒",
        metres: "m",
      },
    },
    athletics: {
      track400: "{lanes}レーンの陸上競技400mトラック。曲走路の縁石の半径は36.50m、直走路は84.39mで、フィニッシュラインとレーン番号があります",
      track200: "{lanes}レーンの200mトラック（ショート・トラック）。バンクのある曲走路の縁石の半径は17.205m、直走路は44.983mで、フィニッシュラインとレーン番号があります",
      infieldPitch: "トラックの内側にはサッカーのピッチがあります。",
      infieldGrass: "トラックの内側は芝生です。",
      infieldNone: "トラックの内側には何もありません。",
      events: "表示しているフィールド種目：{list}。",
      races: "表示しているトラック種目：{list}。",
      start: "{race}のスタートの拡大図。",
      finish: "フィニッシュラインの拡大図。",
      layout: "{event}を大きく表示しています。",
      waterJump: "障害物競走の水濠は第2曲走路の{where}にあります。",
      inside: "内側",
      outside: "外側",
      lane: "第{n}レーン",
      ground: "{ground}の陸上競技トラック",
      data: {
        draw: "{race}のレーン抽選",
        results: "{race}の結果",
        replay: "{race}のリプレイ",
        marks: "{event}の試技",
        summaryDraw: "{race}は{n}選手が出場し、第{first}レーンから第{last}レーンに入ります。",
        summaryResults: "{race}は{winner}が記録{time}で優勝しました。",
        summaryMarks: "試技は{n}回で、最高記録は{who}の{best}です。",
        summaryReplay: "{race}を{n}選手が走ります。",
        columns: { place: "順位", lane: "レーン", athlete: "選手", country: "国", time: "記録", reaction: "反応時間", splits: "スプリット", note: "備考", distance: "記録", round: "試技", valid: "有効" },
        medals: { gold: "金", silver: "銀", bronze: "銅" },
        reaction: "反応時間 {t}秒",
        split: "{d}m：{t}秒",
        foul: "ファウル",
        best: "最高記録",
        yes: "はい",
        no: "いいえ",
        layers: { names: "選手名", flags: "国旗", medals: "順位", splits: "スプリット", reactions: "反応時間", attempts: "試技", best: "最高記録" },
        gun: "号砲",
        finish: "{name}が{time}でフィニッシュ",
        seconds: "秒",
        metres: "m",
      },

    },
    scoreTitle: "{away} {awayScore}、{home} {homeScore}",
    said: { home: "ホーム", away: "アウェイ", won: "{name}の勝ちです。", tied: "同点です。", park: "外野フェンスは、{park}の公表されている距離をもとに描かれています。", officially: "正式名称は{name}です。", ground: "ピッチは、{ground}の公表されている広さをもとに描かれています。", groundDefault: "{ground}のピッチの広さは公表されていないため、国際標準の105×68mで描かれています。", arenaRink: "{arena}のアイスホッケーリンク", arenaCourt: "{arena}のバスケットボールコート", arenaRinkAbout: "アイスホッケーのリンク。{length}フィート（約{lengthM}m）×{width}フィート（約{widthM}m）で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります", arenaCourtAbout: "バスケットボールのコート。{length}フィート（約{lengthM}m）×{width}フィート（約{widthM}m）で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります", arenaSize: "広さは、{arena}の公表されている数値をもとに描かれています。", arenaUnknown: "{arena}のリンクはNHLの規格より短かったとされていますが、広さが示されていないため、NHLの規格で描かれています。", real: "スタンドは、OpenStreetMapの建物の輪郭（(c) OpenStreetMap contributors）の内側に収まるように、{arena}の{seats}席・{tiers}層を推定して描いたもので、アリーナの設計図ではありません。", realBuilding: "リンクは建物の長い軸に沿って置いており（推定）、矢印は北を指します。", realMapped: "リンクの向きはOpenStreetMapに記録された氷面のとおりで、矢印は北を指します。", realNone: "リンクの向きは分かっていないため、東西に置き、北を上にしています。", stadium: "{stadium}の建物の輪郭（OpenStreetMap、(c) OpenStreetMap contributors）の内側に、{seats}席・{tiers}層のスタンドを推定して描いています。スタジアムの設計図ではありません。", stadiumOpening: "フィールドは屋根の開口部（フィールドと同じ大きさ）に沿って置いており、矢印は北を指します。", stadiumBuilding: "フィールドは建物の長い軸に沿って置いており（推定）、矢印は北を指します。", stadiumNone: "フィールドの向きは分かっていないため、東西に置き、北を上にしています。", stadiumHall: "{stadium}の建物の輪郭（OpenStreetMap、(c) OpenStreetMap contributors）の内側に、{seats}席・{tiers}層の客席を推定して描いています。ホールの設計図ではありません。", stadiumRingBuilding: "リングは建物の長い軸に沿って置いており（推定）、矢印は北を指します。", stadiumPitchPark: "ホームプレートの向きは、OpenStreetMapに記録されたグラウンドの芝生を、公表されているフェンスの形に合わせて求めており、矢印は北を指します。", stadiumNonePark: "ホームプレートの向きは分かっていないため、建物に収まる向きでグラウンドを描いており、北を示す矢印はありません。", stadiumPark: "{stadium}の建物の輪郭（OpenStreetMap、(c) OpenStreetMap contributors）の内側に、{seats}席のスタンドを推定して描いています。球場の設計図ではありません。", stadiumPitch: "フィールドの向きはOpenStreetMapに記録されたピッチのとおりで、矢印は北を指します。", stadiumInfield: "ホームプレートの向きは、OpenStreetMapに記録された内野と建物の輪郭から推定しており、矢印は北を指します。", district: "OpenStreetMapの建物の輪郭をもとに、{count}か所の実在の会場を実際の位置と向きのとおりに並べた配置図です。{mode}。", districtNeighbours: "建物のすぐ近くまで寄せて描いています", districtCity: "実際の距離を保ち、1km方眼と縮尺を添えています", districtCredit: "出典：", districtOutside: "会場の外の人出：会場の全座席数の{percent}％にあたる{people}人が、会場の周りの歩道、広場、敷地に立っています。車道には立っていません。", era: "ラインやマークは{season}シーズンのものです。", hammer: "{name}がハンマー（最後の1投）を持っています。", ends: "{name}のエンドごとの得点：{list}。", total: "合計", wonPens: "{name}がPK戦を{a}-{b}で制しました。", pens: "PK戦 {a}-{b}", on: "図の内容", sep: "、", stop: "。", colon: "：", gap: "" },
    budo: {
      sides: { north: "北", south: "南", east: "東", west: "西" },
      judo: "柔道の試合場。試合場内は{contest}m四方、幅{safety}mの安全地帯があり、{tatami}の畳を敷いています",
      judoMany: "柔道の試合場。{contest}m四方の試合場内が{areas}面、間隔は{gap}mで、それぞれ幅{safety}mの安全地帯があり、{tatami}の畳を敷いています",
      judoKata: "柔道の形の試合場。{contest}m四方で、幅{safety}mの安全地帯があり、{tatami}の畳を敷いています",
      danger: "各試合場内の縁に沿って、畳1枚分の幅の赤い危険地帯があります。",
      platform: "畳は、それより縦横とも1m大きい台の上にあります。",
      start: "選手の開始位置を示すテープが、中央に{apart}m離れて貼られています。",
      officials: "係員席は図の上側にあります。",
      tatami: "{length}×{width}m",
      karate: "空手道の組手の試合場。一辺{area}mの正方形にマットを敷き、外側の1mは別の色で、幅{safety}mの安全地帯があり、開始位置のマットが2枚あります",
      karateMany: "空手道の組手の試合場。一辺{area}mの正方形が{areas}面で、外側の1mは別の色、間隔は{gap}mで、それぞれ幅{safety}mの安全地帯があり、開始位置のマットが2枚あります",
      karateKata: "空手道の形の試合場。一辺{area}mの正方形にマットを敷き、幅{safety}mの安全地帯があります",
      karateOfficials: "係員席、主審、4人の副審の位置を示しています。",
      kendo: "剣道の試合場。{side}m四方の板張りで、白い境界線、中央の×印、2本の開始線があり、外側に1.5mの余地があります",
      sumo: "相撲の土俵。一辺{platform}m、高さ{height}cmの粘土の正方形に、{count}俵でつくる直径{circle}mの円、蛇の目の砂、2本の仕切り線があります",
      sumoBare: "相撲の土俵。一辺{platform}m、高さ{height}cmの粘土の正方形に、直径{circle}mの円があります",
      tassels: "吊り屋根の四つの房は、四方の色です。東は青、南は赤、西は白、北は黒です。",
      kyudo: "近的の弓道場。射位が{n}か所ある射場から、安土の的まで{distance}mあり、その間に矢道があり、横に矢取道があります",
      kyudoEnteki: "遠的の弓道場。射位が{n}か所ある射場から、安土の直径1mの的まで{distance}mあり、その間に矢道があり、横に矢取道があります",
      dojoTraditional: "{jo}畳の道場。{width}×{length}mで、{mat}mの畳を、4枚の角が1点に集まらないように敷いています",
      dojoCompetition: "{jo}畳の道場。{width}×{length}mで、{mat}mの畳を、試合場内と安全地帯の色に分けて敷いています",
      dojoChecker: "{jo}畳の道場。{width}×{length}mで、{mat}mの畳を、二色が交互になるように敷いています",
      dojoBorder: "{jo}畳の道場。{width}×{length}mで、{mat}mの畳を敷き、周りに別の色の帯があります",
      dojoKamiza: "上座は{side}にあります。",
      dojoShinzen: "上座に神棚があります。",
      dojoDais: "上座に、一段高い台があります。",
      dojoBanner: "上座側の壁に、無地の濃い色の垂れ幕が掛かっています。",
      dojoAreas: "床に、8m四方の試合場が{n}面示されています。",
      dojoWalls: "壁があり、{doors}と{windows}があります。",
      mma: "総合格闘技のケージ。対辺間の距離が{feet}フィート（約{width}m）の八角形で、高さ{fence}cmの金網と、パッド付き支柱8本があります。{platform}",
      mmaPlatform: "ケージは高さ{height}cmの台の上にあります",
      mmaFloor: "ケージは床と同じ高さにあります",
      mmaGates: "出入口は向かい合う2か所にあります。",
      mmaSteps: "各出入口に、台へ上がる階段があります。",
      boxing: "ボクシングのリング。キャンバスを張った床は、ロープの内側が一辺{feet}フィート（約{size}m）の正方形で、各辺に4本のロープが張られています。ロープの外側には幅{apron}cmのエプロンが続き、四隅にパッド付きのコーナーポストがあります。{platform}",
      boxingPlatform: "リングは高さ{height}cmの台の上にあります",
      boxingFloor: "リングは床と同じ高さにあります",
      boxingCorners: "コーナーの色は、ボクサー用が赤と青、中立コーナーが白です。",
      boxingSteps: "台へ上がる階段は3か所で、各ボクサーのコーナーに1か所ずつと、中立コーナーに1か所あります。",
      wrestlingUww: "UWWのレスリングマット（フリースタイルとグレコローマン）。直径{circle}mの円の外側に幅{border}mのプロテクションエリアがあり、円の内側には幅{band}mのオレンジ色のパッシビティゾーンがあります。{platform}",
      wrestlingFolk: "フォークスタイルのレスリングマット。直径{feet}フィート（約{circle}m）の円の外側に、幅{border}フィートのマットが敷かれています。{platform}",
      wrestlingPlatform: "マットは高さ{height}mの台の上にあります",
      wrestlingFloor: "マットは会場の床に敷かれています",
      wrestlingCentre: "中央には直径{d}mの円があります。",
      wrestlingLines: "中央の平行な2本のスタートラインは、一方の端が緑の線、もう一方の端が赤の線で閉じられています。",
      prowrestling: "プロレスのリング。キャンバスを張った床は、ロープの内側が一辺{feet}フィート（約{size}m）の正方形で、各辺に3本のロープが張られています。ロープの外側には幅{apron}cmのエプロンが続き、四隅にパッド付きのコーナーポストがあります。{platform}",
      prowrestlingRopes: "各辺の3本のロープは、互いにつながっていません。",
      prowrestlingSteps: "台の脇、2つのコーナーのそばに、鉄製の階段があります。",
      board: {
        ippon: "一本", wazaari: "技あり", yuko: "有効", shido: "指導", senshu: "先取", chui: "注意", points: "ポイント", kimarite: "決まり手",
        techniques: { men: "面", kote: "小手", do: "胴", tsuki: "突き", hansoku: "反則" },
        judoScore: "{name}：{list}。", karateScore: "{name}：{list}。", kendoScore: "{name}：{list}。", sumoScore: "{name}の勝ち。決まり手は{kimarite}。",
      },
    },
    pageant: { carpet: "各チームの旗またはロゴが、競技場のチームごとの区域に、カーペットのように大きく広げられています。", stage: "各チームのエンブレムが、競技場のチームごとの区域にある大きな丸いステージの上に置かれています。", emblem: "中央にエンブレムがあります。", emblemNamed: "中央に{name}のエンブレムがあります。" },
    situation: {
      home: "ホームチーム",
      away: "アウェイチーム",
      homeShort: "ホーム",
      awayShort: "アウェイ",
      pp: "PP",
      en: "EN",
      delayed: "ディレード",
      shootout: "SO",
      gws: "GWS",
      sudden: "SD",
      powerPlay: "パワープレー：{team}が{a}人、相手は{b}人です。",
      strength: "スケーターは{a}人対{b}人です。",
      penaltyTime: "ペナルティの残り時間は{clock}です。",
      emptyNet: "{team}はゴーリーを下げ、ゴールは無人です。",
      delayedPenalty: "{team}に対するディレードペナルティで、プレーは続いています。",
      shootoutScore: "シュートアウト（{n}ラウンド終了時点）：{away} {awayGoals}、{home} {homeGoals}。",
      gwsScore: "ゲームウイニングショット（{n}ラウンド終了時点）：{away} {awayGoals}、{home} {homeGoals}。",
      suddenDeath: "4ラウンド目からはサドンデスです。",
      top: "表",
      bottom: "裏",
      inning: "{n}回{half}です。",
      inningOnly: "{n}回です。",
      halfOnly: "イニングの{half}です。",
      noOuts: "ノーアウトです。",
      oneOut: "1アウトです。",
      outs: "{n}アウトです。",
      basesEmpty: "走者はいません。",
      basesLoaded: "満塁です。",
      runnersOn: "{list}に走者がいます。",
      bases: ["一塁", "二塁", "三塁"],
      and: "と",
      count: "カウントは{b}ボール{s}ストライクです。",
      downs: ["第1ダウン", "第2ダウン", "第3ダウン", "第4ダウン"],
      tag: "{ord} {n}ヤード",
      tagGoal: "{ord} ゴール前",
      down: "{ord}です。",
      downDistance: "{ord}、残り{n}ヤードです。",
      downGoal: "{ord}、ゴール前（ゴール・トゥ・ゴー）です。",
      ballOwn: "ボールは攻撃側の自陣{n}ヤードラインにあります。",
      ballOpp: "ボールは攻撃側の敵陣{n}ヤードラインにあります。",
      ballMid: "ボールはミッドフィールドにあります。",
      placeOwn: "自陣{n}ヤード",
      placeOpp: "敵陣{n}ヤード",
      placeMid: "ミッドフィールド",
      tagOwn: "自陣{n}",
      tagOpp: "敵陣{n}",
      redZone: "ボールはレッドゾーンにあります。",
      possession: "{team}がボールを持っています。",
      driveLine: "{team}のドライブ、{from}から{to}まで：{result}。",
      driveNoResult: "{team}のドライブ、{from}から{to}まで。",
      results: { touchdown: "タッチダウン", "field-goal": "フィールドゴール", "missed-field-goal": "フィールドゴール失敗", punt: "パント", turnover: "ターンオーバー", interception: "インターセプト", fumble: "ファンブル", downs: "ダウン更新失敗によるターンオーバー", safety: "セーフティ", "end-of-half": "ハーフ終了" },
    },
    special: {
      guest: { skating: "リンク", nfl: "アメリカンフットボールのフィールド", cfl: "カナディアンフットボールのフィールド", ifaf: "アメリカンフットボールのフィールド", nhl: "リンク", nba: "コート", mlb: "野球のグラウンド", soccer: "ピッチ", curling: "シート", tennis: "コート", volleyball: "コート", badminton: "コート", pickleball: "コート", tabletennis: "卓球台", padel: "コート", squash: "コート", racquetball: "コート", sepaktakraw: "コート", teqball: "コート", roundnet: "コート", netball: "コート", lacrosse: "フィールド", rugby: "グラウンド", afl: "グラウンド", gaelic: "フィールド", cricket: "グラウンド", fieldhockey: "ピッチ", handball: "コート", swimming: "プール", waterpolo: "プール", diving: "プール", artisticswimming: "プール", athletics: "トラック", judo: "試合場", karate: "試合場", kendo: "試合場", sumo: "土俵", kyudo: "弓道場", dojo: "道場", mma: "ケージ", boxing: "リング", wrestling: "マット", prowrestling: "リング" },
      title: "{host}の中の{guest}",
      game: "{event}、{date}。",
      inside: "{guest}全体が{host}の輪郭の内側に収まっています。",
      hangs: "{guest}の一部（面積の{pct}％）が{host}の輪郭の外にはみ出しています。",
      foul: "球場の輪郭はフェンスの内側のフェアゾーンなので、内野の上にリンクやコートなどを置くと、ファウルゾーンにはみ出します。",
      unnamed: { field: "フットボールのフィールド", pitch: "ピッチ", deck: "甲板" },
      published: "置かれた位置は資料に基づいています：{note}",
      convention: "正確な位置を示す資料がないため、慣例に従って置いています：{rule}",
      rules: {
        infield: "中心を内野の中心（一塁と三塁を結ぶ線と、本塁と二塁を結ぶ線の交点）に合わせ、長辺をグラウンドを横切る向き、つまり一塁から三塁への向きにしています。",
        midfield: "中心をフィールドの中心に合わせ、長辺をフィールドに沿わせています。",
        diamond: "内野の中心をピッチの中心に合わせ、本塁から中堅へ向かう線をピッチに沿わせています。",
        deck: "中心を甲板の中心に合わせ、長辺を甲板に沿わせています。",
      },
      months: "1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月",
      date: "{year}年{month}{day}日",
      and: "、",
    },
    charts: {
      titleNba: "NBAのショットチャート", titleNhl: "NHLのシュートマップ", titleMlb: "野球の打球方向図", titleNfl: "NFLのパスチャート", titleSoccer: "サッカーのシュートマップ", titleGoal: "ゴールマウス：シュートがゴールラインを通過した位置",
      titleCurling: "カーリングのストーンの位置", curlingEnd: "第{n}エンド", curlingStone: "ストーン", curlingCounting: "得点になるストーン", curlingShot: "ナンバーワンストーン（ボタンに最も近いストーン）", curlingFrom: "{name}：ボタンから{d}フィート", curlingNoteCounting: "得点になるストーン", curlingNoteShot: "ナンバーワンストーン",
      sumCurling: "プレー中のストーンは{n}個です。{team}が{points}点を取ります。", sumCurlingBlank: "プレー中のストーンは{n}個です。どちらも得点できず、ブランクエンドになります。", curlingOut: "{n}個はプレー外です。",
      titleCurlingHeat: "ストーンが止まった位置", curlingHeatStat: "ストーン", sumCurlingHeat: "プレー中のストーンは{n}個です。ハウス内が{house}個、フリーガードゾーン内が{guards}個です。", curlingHeatTeam: "{name}のストーンのみです。", curlingHeatGuards: "フリーガードのみです。", curlingHeatHouse: "ハウス内のストーンのみです。",
      shots: "シュート", passes: "パス", balls: "インプレー打球", ballsBeyond: "フェンス越えの打球", lineOfScrimmage: "スクリメージライン", key: "凡例",
      made: "成功", missed: "失敗", missedNet: "枠外", goal: "ゴール", saved: "セーブ", blocked: "ブロック", shot: "シュート", post: "ポスト直撃",
      single: "単打", double: "二塁打", triple: "三塁打", homeRun: "本塁打", out: "アウト", complete: "パス成功", incomplete: "パス不成功", touchdown: "タッチダウン", interception: "インターセプト",
      sizeXg: "大きさ：xG", sizeNote: "マークの大きさは、そのシュートの期待ゴール数（xG）を表します。", xgTotal: "xG合計 {n}",
      fgRate: "フィールドゴール成功率（％）", completionRate: "パス成功率（％）", goalRate: "シュート決定率（％）", xgStat: "期待ゴール数（xG）", hitRate: "安打の割合（インプレー打球に対する％）",
      leagueNote: "ゾーンの色は、リーグ平均{league}％との差を表します。",
      sumNba: "シュート{shots}本、成功{made}本（{pct}％）。", sumShots: "シュート{shots}本、{goals}ゴール。", sumShotsXg: "シュート{shots}本、{goals}ゴール、期待ゴール数（xG）{xg}。",
      sumMlb: "インプレー打球{balls}本：{list}。", sumNfl: "パス{passes}本、成功{complete}本（{pct}％）、タッチダウン{td}回、インターセプト{int}回。",
      beyondNote: "フェンスを越えた打球は{n}本です。", airYards: "エアヤード：{min}〜{max}ヤード。",
      goalDesc: "ゴール枠（幅{w}m×高さ{h}m）を正面から見た図です。図の左側が、シュートを打つ選手の左手側です。",
      titlePassNetwork: "パスネットワーク", sizeTouches: "円の大きさ：タッチ数", widthPasses: "線の太さ：パス数", sumNetwork: "パス{passes}本、選手{players}人、つながり{links}本。",
    },
    layers: {
      pointOne: "データ点", pointMany: "データ点", lineOne: "線", lineMany: "線", arrowOne: "矢印", arrowMany: "矢印", textOne: "ラベル", textMany: "ラベル",
      count: "{noun} {n}件", item: "{name} {n}件", listSep: "、", outcomes: "結果別：{list}。", teams: "チーム別：{list}。", values: "値の範囲：{min}〜{max}。", skipped: "位置が不明なため{n}件は描かれていません。", data: "データ",
      tableNo: "番号", tableX: "x", tableY: "y", tableToX: "終点のx", tableToY: "終点のy", tablePath: "経路", tableValue: "値", tableTeam: "チーム", tableOutcome: "結果", tableNote: "備考", tableText: "ラベル",
      tableFrame: "座標系：{frame}、単位：{unit}。", tableMore: "全{total}行のうち先頭の{shown}行を表示しています。",
      heatTitle: "{noun}のヒートマップ（{n}件）", hexTitle: "{noun}の六角形ビン図（{n}件）", zonesTitle: "{noun}のゾーン別集計（{n}件）", contourTitle: "{noun}の密度等高線（{n}件）", legendTitle: "凡例：{name}",
      range: "{min}〜{max}", heatNote: "{n}個のセルの{stat}は{min}〜{max}です。", hexNote: "{n}個の六角形の{stat}は{min}〜{max}です。", zoneNote: "{n}個のゾーンの{stat}は{min}〜{max}です。", contourNote: "密度の等高線は{n}本です。ピークは({x}, {y})付近です。",
      top: "上位：{list}。", outside: "グリッドまたはゾーンの範囲外のデータが{n}件あります。",
      stat: { count: "件数", sum: "合計", mean: "平均", median: "中央値", percent: "全体に占める割合（％）", max: "最大", min: "最小", rate: "成功率（％）", custom: "値", density: "密度（ピークに対する割合、％）", mass: "内側に含まれるデータの割合（％）" },
      tableZone: "ゾーン", tableCount: "件数", tableShare: "割合（％）", tableLevel: "レベル", tableCell: "セル", tableCells: "{stat}。各セルの中心の位置です。座標系：{frame}、単位：{unit}。", tableCellsPlain: "{stat}。各セルの中心の位置です。単位：{unit}。", valueItem: "{name}（{n}）",
      zones: {
        pair: "{a}・{b}", atEnd: "{name}（{end}）", endLeft: "左ゴール側", endRight: "右ゴール側", band: "{n}列目", zone: "ゾーン{n}",
        wingLeft: "左サイド", halfLeft: "左ハーフスペース", laneCentre: "中央", halfRight: "右ハーフスペース", wingRight: "右サイド",
        defensiveThird: "ディフェンディングサード", middleThird: "ミドルサード", attackingThird: "アタッキングサード",
        poolLane: "第{n}レーン", poloGoalArea: "ゴールエリア（2mまで）", poloTwoToSix: "ゴールラインから2〜6m", poloBeyondSix: "6mより先", poolNear: "手前の3分の1", poolMiddle: "真ん中の3分の1", poolFar: "奥の3分の1",
        restricted: "リストリクテッドエリア", paint: "ペイント内（リストリクテッドエリア外）", midRange: "ミッドレンジ", cornerLeft: "左コーナー3", cornerRight: "右コーナー3", aboveBreak: "アバブ・ザ・ブレイク3",
        innerSlot: "内側スロット", outerSlot: "外側スロット", offensiveZone: "アタッキングゾーン", behindGoalLine: "ゴール裏", homePlate: "ゴール前の五角形エリア", outsideHomePlate: "五角形エリアの外",
        pull: "引っ張り方向", opposite: "逆方向", sprayCentre: "センター方向", leftField: "レフト方向", centreField: "センター方向", rightField: "ライト方向", infield: "内野", outfield: "外野",
        lengthShort: "ショートパス", lengthDeep: "ディープパス", houseButton: "ボタン", houseFour: "4フィートの円", houseEight: "8フィートの円", houseTwelve: "12フィートの円", guardZone: "フリーガードゾーン", frontCourt: "フロントコート", backCourt: "バックコート", halfCourt: "ハーフコート", outsideCircles: "サーブの円の外側", servingRing: "ノーヒットゾーンとサーブの円の間", noHitZone: "ノーヒットゾーン", sideLeft: "左", sideMiddle: "中央", sideRight: "右",
        pitchZone: "ピッチ", insideCircle: "サークルの内側", outfieldGround: "アウトフィールド",
        trackInfield: "インフィールド", homeStraight: "メイン側直走路", firstBend: "第1曲走路", backStraight: "バック・ストレート", secondBend: "第2曲走路", crossingStraight: "交差ストレート", firstCurve: "第1カーブ", secondCurve: "第2カーブ", finishStraight: "フィニッシュ側ストレート", rinkLeft: "左端", rinkMiddle: "中央", rinkRight: "右端", budoContest: "試合場内", budoSafety: "安全地帯", budoBand: "境界の帯", budoFloor: "床", budoClay: "土", budoJano: "蛇の目", budoRing: "土俵の円", budoShajo: "射場", budoYamichi: "矢道", budoAzuchi: "安土", budoKamiza: "上座側", budoRest: "それ以外の床",
      },
    },
    team: {
      networkTitle: "パスネットワーク：選手{players}人、つながり{links}本（パス{passes}本）", networkNote: "最多タッチ：{name}（{touches}回）。パスが最も多いつながり：{a}と{b}、{n}本。", networkNoteDirected: "最多タッチ：{name}（{touches}回）。パスが最も多いつながり：{a}から{b}へ、{n}本。", networkMin: "パスが{n}本未満のつながりは描かれていません。",
      nodeTitle: "{name}：タッチ{touches}回（出したパス{made}本、受けたパス{received}本）", linkTitle: "{a}と{b}：パス{n}本", linkTitleDirected: "{a}から{b}へ：パス{n}本",
      formationTitle: "フォーメーション{name}：{n}人分のポジション", formationNote: "ポジション：{list}。", formationPlayers: "選手：{list}。", formationItem: "{who}（{position}）",
      lineupTitle: "{name}のラインナップ：選手{n}人", lineupCaptain: "キャプテン：{who}。", lineupRotation: "ローテーション：6つのうち{n}番目。", lineupUnplaced: "フォーメーションに配置されていない選手：{list}。", captainTip: "キャプテン", captainMark: "C", tableCaptain: "キャプテン",
      voronoiTitle: "選手{n}人のスペース支配（ボロノイ図）", voronoiNote: "競技場のうち、各チームの選手が最も近い範囲の割合：{list}。", shareItem: "{name} {pct}％", voronoiShared: "{n}人は他の選手と同じ位置にいるため、エリアがありません。",
      delaunayTitle: "選手{n}人のドロネー三角形分割", delaunayNote: "三角形{triangles}個、辺{edges}本。",
      hullTitle: "選手{n}人の凸包", hullItem: "{name}：選手{n}人、面積{area}{unit}", hullAll: "全選手", squareUnits: { ft: "平方フィート", yd: "平方ヤード", m: "平方メートル" }, squareOther: "平方{unit}",
      flowTitle: "{n}件の移動の流れ（{cells}個のセル）", flowNote: "セルごとの平均的な移動の長さは最大で{len}{unit}です。",
      sonarTitle: "{n}件の移動の方向別分布：ローズ図{roses}個（各{angles}方向）", sonarNote: "最も多い方向：{deg}度（{n}件）。", sonarAngles: "競技場を横長に描いたとき、0度は右端の方向、90度は上辺の方向です。", roseTitle: "{name}：{n}件の移動、最も多いのは{deg}度方向", barTitle: "{from}度〜{to}度：{value}",
      tablePlayer: "選手", tableFrom: "出し手", tableTo: "受け手", tablePasses: "パス数", tableMade: "出したパス", tableReceived: "受けたパス", tableTouches: "タッチ数", tablePosition: "ポジション", tableNumber: "背番号", tableName: "名前", tablePlayers: "選手数", tableShare: "競技場に占める割合（％）", tableArea: "面積", tableCorners: "頂点数", tableTriangles: "三角形の数", tableEdges: "辺の数", tableDirection: "平均の方向（度）", tableLength: "平均の長さ", tableSteady: "方向の揃い具合（％）", tableFromAngle: "開始角（度）", tableToAngle: "終了角（度）", tableRose: "ローズ図",
      tableUnit: "長さの単位：{unit}。",
    },
    notes: {
      home: "ホーム", away: "アウェイ", attacking: "{team}の攻撃方向", left: "左", right: "右",
      attacks: "{team}は{side}方向へ攻めます。", attacksIn: "第{n}ピリオド、{team}は{side}方向へ攻めます。",
      axesSurface: "この図の座標軸です。単位は{unit}で、xは{x0}から{x1}、yは{y0}から{y1}です。",
      axesFrame: "{frame}の座標系の軸です。単位は{unit}で、xは{x0}から{x1}、yは{y0}から{y1}です。",
      labelled: "名称を表示している部分：{list}。",
      names: {
        "end-zone": "エンドゾーン", "goal-line": "ゴールライン", "yard-line": "ヤードライン", midfield: "ミッドフィールド", "end-line": "エンドライン", sideline: "サイドライン", "hash-marks": "ハッシュマーク", "yard-numbers": "ヤードナンバー", "goal-posts": "ゴールポスト", pylon: "パイロン",
        boards: "ボード", "blue-line": "ブルーライン", "face-off-circle": "フェイスオフサークル", crease: "クリース", net: "ゴールネット", "centre-circle": "センターサークル", "centre-red-line": "センターレッドライン", trapezoid: "トラペゾイド", "referee-crease": "レフェリークリース",
        baseline: "ベースライン", "halfway-line": "ハーフウェーライン", "half-court-line": "センターライン", key: "ペイントエリア", "free-throw-line": "フリースローライン", "free-throw-circle": "フリースローサークル", backboard: "バックボード", basket: "リング", "three-point-line": "スリーポイントライン", "restricted-area": "リストリクテッドエリア",
        "home-plate": "本塁", "first-base": "一塁", "second-base": "二塁", "third-base": "三塁", "foul-line": "ファウルライン", "outfield-fence": "外野フェンス", "warning-track": "ウォーニングトラック", "pitchers-plate": "投手板", "batters-box": "バッターボックス",
        touchline: "タッチライン", "penalty-area": "ペナルティーエリア", "goal-area": "ゴールエリア", "penalty-mark": "ペナルティーマーク", "penalty-arc": "ペナルティーアーク", "corner-arc": "コーナーアーク", goal: "ゴール",
        "service-line": "サービスライン", "centre-service-line": "センターサービスライン", "singles-sideline": "シングルスサイドライン", "centre-mark": "センターマーク", "attack-line": "アタックライン", antenna: "アンテナ", "back-boundary-line": "バックバウンダリーライン（シングルスのロングサービスライン）", "doubles-long-service-line": "ダブルスのロングサービスライン", "short-service-line": "ショートサービスライン", "non-volley-line": "ノンボレーライン", "non-volley-zone": "ノンボレーゾーン", "court-net": "ネット",
        "back-wall": "バックウォール", "side-wall": "サイドウォール", "metal-fence": "金網", "front-wall": "フロントウォール", tin: "ティン", "wall-service-line": "サービスライン（前壁）", "front-wall-line": "フロントウォールライン", "short-line": "ショートライン", "squash-half-court-line": "ハーフコートライン", "service-box": "サービスボックス",
        "service-zone": "サービスゾーン", "drive-serve-line": "ドライブサーブライン", "receiving-line": "レシービングライン", "safety-zone": "セーフティーゾーン", "quarter-circle": "クォーターサークル", "service-circle": "サービスサークル", table: "テーブル", "court-surround": "コート周囲のエリア",
        "roundnet-set": "ラウンドネットのセット", "no-hit-zone": "ノーヒットゾーン", "service-position": "サーブ位置", "transverse-line": "トランスバースライン", "goal-circle": "ゴールサークル", goalpost: "ゴールポスト", "goal-ring": "ゴールリング",
        "hog-line": "ホッグライン", "tee-line": "ティーライン", "back-line": "バックライン", house: "ハウス", button: "ボタン", "centre-line": "センターライン", hack: "ハック", "free-guard-zone": "フリーガードゾーン",
        "try-line": "トライライン", "dead-ball-line": "デッドボールライン", "twenty-two-line": "22メートルライン", "ten-metre-line": "10メートルライン", "forty-metre-line": "40メートルライン", "in-goal": "インゴール",
        "boundary-line": "バウンダリーライン", "behind-line": "ビハインドライン", "goal-square": "ゴールスクエア", "centre-square": "センタースクエア", "fifty-metre-arc": "50メートルアーク", "behind-posts": "ビハインドポスト",
        "distance-line": "距離を示すライン", "large-rectangle": "大きい長方形", "small-rectangle": "小さい長方形", "thirteen-metre-arc": "13メートルアーク", "forty-metre-arc": "40メートルアーク", "penalty-point": "ペナルティーマーク",
        boundary: "バウンダリー", pitch: "ピッチ", "bowling-crease": "ボウリングクリース", "popping-crease": "ポッピングクリース", "return-crease": "リターンクリース", wicket: "ウィケット", "thirty-yard-circle": "30ヤードサークル",
        "twenty-three-line": "23メートルライン", "shooting-circle": "シューティングサークル", "penalty-spot": "ペナルティースポット", "broken-circle-line": "サークルを囲む破線", "goal-area-line": "ゴールエリアライン",
        "referee-position": "主審の位置", "shiai-jo": "試合場", floorboard: "床板", heri: "畳縁", "contest-area": "試合場内", "safety-area": "安全地帯", "danger-zone": "危険地帯", "start-mark": "開始線", "common-safe-zone": "共通の安全地帯", "free-zone": "フリーゾーン", platform: "畳の台", "technical-table": "係員席", "centre-tape": "中央のテープ", "kata-judges": "審判員席（正面側）", "coach-chair": "コーチ席", "kata-entry": "入退場口（正面の反対側）", arena: "アリーナの床", "competition-area": "試合場", "boundary-band": "境界の帯", "start-mat": "開始位置のマット", judge: "副審", "between-areas": "試合場の間", "centre-cross": "中央の×印", "kaishi-sen": "開始線", "outer-boundary": "場外の余地", dohyo: "土俵", ring: "土俵の円", tawara: "俵", tokudawara: "徳俵", "shikiri-sen": "仕切り線", "jano-me": "蛇の目", shajo: "射場", "shooting-position": "射位", honza: "本座", yamichi: "矢道", "yatori-michi": "矢取道", azuchi: "安土", mato: "的", kamiza: "上座", "cage-canvas": "キャンバス", "cage-fence": "金網", "cage-post": "パッド付き支柱", "cage-gate": "出入口", "cage-steps": "階段", "cage-platform": "台", "ring-canvas": "キャンバス", "ring-ropes": "ロープ", "ring-post": "コーナーポスト", "ring-red-corner": "赤コーナー", "ring-blue-corner": "青コーナー", "ring-apron": "エプロン", "ring-steps": "階段", "ring-platform": "台", "mat-circle": "レスリングエリア", "mat-central": "中央の競技面", "mat-border": "マットの外周部", "mat-passivity": "パッシビティゾーン", "mat-centre-circle": "センターサークル", "mat-starting-lines": "スタートライン", "mat-platform": "台", shimoza: "下座", shinzen: "神棚", dais: "上座の台", banner: "垂れ幕", entrance: "入口", window: "窓", tatami: "畳", wall: "壁", "inner-lane": "インレーン", "outer-lane": "アウトレーン", "crossing-straight": "交差ストレート", "warm-up-lane": "ウォームアップレーン", padding: "防護マット", infield: "インフィールド", "coaches-area": "コーチエリア", blocks: "ブロック", "track-line": "トラックのライン", "start-lines": "スタートライン", ice: "氷面", "technical-panel": "テクニカルパネル", referee: "レフェリー", "kiss-and-cry": "キス・アンド・クライ", judges: "ジャッジ席", runway: "助走路", "take-off-board": "踏切板", "landing-area": "砂場", "throwing-circle": "投てきサークル", sector: "着地場所", "stop-board": "足留材", cage: "囲い", "throwing-arc": "スターティング・ライン", crossbar: "バー", "landing-mat": "着地マット", "run-up": "助走路", "zero-line": "ゼロライン", box: "ボックス",
        "finish-line": "フィニッシュライン", kerb: "縁石", "lane-lines": "レーンライン", bend: "曲走路", straight: "直走路", "infield-pitch": "サッカーのピッチ", "start-line": "スタートライン", breakline: "ブレイクライン", "water-jump": "水濠", "exchange-zone": "テークオーバーゾーン",
        "seven-metre-line": "7mスローライン", "four-metre-line": "4mライン", "throw-off-area": "スローオフエリア", "restraining-line": "リストレイニングライン", "wing-line": "ウイングライン", "marking-area": "マーキングエリア", "two-point-arc": "2ポイントアーク",
        "lane-rope": "レーンロープ", "lane-line": "床面のレーンライン", "lane-end-cross": "クロスライン", "fifteen-metre-mark": "15mマーク", "touch-pad": "タッチ板", "starting-block": "スタート台", "backstroke-flags": "背泳ぎ用フラッグ", "false-start-rope": "フォルススタートロープ", gutter: "ガター",
        "two-metre-line": "2mライン", "five-metre-mark": "5mの標識", "six-metre-line": "6mライン", "half-distance-line": "ハーフライン", "re-entry-area": "再入水エリア", "referee-platform": "審判台", "official-table": "オフィシャル席", "substitution-area": "交代エリア",
        "springboard-1m": "1m飛板", "springboard-3m": "3m飛板", "platform-1m": "1m固定台", "platform-3m": "3m固定台", "platform-5m": "5m固定台", "platform-7-5m": "7.5m固定台", "platform-10m": "10m固定台", "diving-line": "飛込プールのレーンマーク",
        "deep-part": "深い部分", "judges-platform": "ジャッジ台", "starting-platform": "スタート台", "floor-lines": "プール底のライン",
      },
    },
    ranges: {
      shows: "表示範囲は{name}です。", showsEnd: "表示範囲は{side}側の{name}です。",
      box: "競技場の一部だけを表示しています。xは{x0}から{x1}、yは{y0}から{y1}です。",
      boxFrame: "競技場の一部だけを表示しています。{frame}の座標系で、xは{x0}から{x1}、yは{y0}から{y1}です。",
      cut: "範囲外のデータは描かれません。",
      names: {
        "red-zone": "レッドゾーン", "between-the-20s": "20ヤードライン間のフィールド", "end-zone": "エンドゾーン", "field-of-play": "ゴールライン間のフィールド", "own-half": "自陣の半面", "opponent-half": "敵陣の半面",
        "offensive-zone": "アタッキングゾーン", "defensive-zone": "ディフェンディングゾーン", "neutral-zone": "ニュートラルゾーン", half: "半面", "half-court": "ハーフコート", paint: "ペイントエリア",
        "final-third": "アタッキングサード", "defensive-third": "ディフェンディングサード", "middle-third": "ミドルサード", "penalty-area": "ペナルティーエリア", infield: "内野", outfield: "外野", sheet: "シート全体", house: "ハウス", folded: "折りたたんだシート全体",
        "in-goal": "インゴール", "twenty-two": "トライラインから22メートルラインまでのエリア", twenty: "ゴールラインから20メートルラインまでのエリア", crease: "クリース", "forward-fifty": "50メートルアークの内側", "centre-square": "センタースクエア",
        "large-rectangle": "大きい長方形", pitch: "ピッチ", circle: "サークル", "twenty-three": "23メートルエリア", "goal-area": "ゴールエリア",
        "pool-end": "プールの端（15mの目印まで）", springboards: "飛板", platforms: "固定台", "centre-stage": "プールの中央（真ん中の3分の1）",
        "contest-area": "試合場内", ring: "土俵の円", shajo: "射場", yamichi: "矢道", azuchi: "安土", kamiza: "上座", cage: "ケージ", gate: "出入口", ropes: "ロープの内側", corner: "コーナー", passivity: "パッシビティゾーン", "crossing-straight": "交差ストレート", "first-bend": "第1カーブ", "second-bend": "第2カーブ", judges: "ジャッジ席", "kiss-and-cry": "キス・アンド・クライ", bend: "曲走路", "home-straight": "メイン側直走路", "back-straight": "バック・ストレート", finish: "フィニッシュライン", start: "スタート", "high-jump": "走高跳", "pole-vault": "棒高跳", "long-jump": "走幅跳", "triple-jump": "三段跳", "shot-put": "砲丸投", "discus-throw": "円盤投", "hammer-throw": "ハンマー投", "javelin-throw": "やり投", "water-jump": "水濠",
      },
      folded: {
        top: "上のハウス", bottom: "下のハウス", left: "左のハウス", right: "右のハウス",
        tall: "折りたたみ表示です。シート全体を中央に置き、上のハウスを左に、下のハウスを右に拡大して表示しています。",
        wide: "折りたたみ表示です。シート全体を中央に置き、左のハウスを上に、右のハウスを下に拡大して表示しています。",
        half: "拡大部分はホッグラインからバックラインまでです。",
        house: "拡大部分はハウスです。",
        data: "データは拡大部分にも描かれます。",
      },
    },
    grid: { title: "図のグリッド（{n}枚）", drawings: "図（{n}枚）：{list}。", key: "凡例：{list}。", cell: "{total}枚中{n}枚目の図", listSep: "；" },
    replay: {
      title: "リプレイ（再生時間{time}）", objects: "追跡対象は{n}個", objectsOne: "追跡対象は{n}個", events: "イベント{n}件", eventsOne: "イベント{n}件", players: "選手", others: "ボール・パック・審判", trail: "直近{s}秒の軌跡", numbers: "背番号", eventLines: "パスとシュート",
      home: "ホーム", away: "アウェイ", ball: "ボール", puck: "パック", official: "審判", pass: "パス", shot: "シュート", goal: "ゴール", whistle: "ホイッスル",
      announce: "{what}、{time}", announceTeam: "{team}の{what}、{time}",
      group: "リプレイの操作", play: "再生", pause: "一時停止", back: "前のコマ", forward: "次のコマ", stepBack: "前へ", stepForward: "次へ", speed: "再生速度", loop: "繰り返し", position: "再生位置", time: "時間", event: "イベント", spokenSeconds: "{s}秒", spokenMinutes: "{m}分{s}秒", spokenHours: "{h}時間{m}分{s}秒", positionValue: "{total}中{t}",
      keys: "プレーのリプレイです。スペースキーで再生と一時停止、左右の矢印キーで1コマずつ前後に移動、Shiftキーを押しながら矢印キーで5秒ずつ移動、Homeキーで最初、Endキーで最後に移動します。",
      keysStep: "プレーのリプレイです。コマ送りで表示しています。スペースキーまたは右矢印キーで進み、左矢印キーで戻り、Homeキーで最初、Endキーで最後に移動します。",
      region: "リプレイ",
    },
    turn: {
      region: "3D表示", group: "視点",
      keys: "回して見られる3D表示です。ドラッグするか矢印キーで回転と傾きを変え、プラスとマイナスのキーで拡大と縮小、1から4のキーで視点を選び、0キーまたはHomeキーで元に戻し、スペースキーで自動回転を始めたり止めたりします。ピンチ操作、またはCtrlキーを押しながらのスクロールでも拡大・縮小できます。",
      overhead: "真上", broadcast: "中継カメラ", end: "エンド側から", corner: "低い角度から",
      reset: "元に戻す", turnLeft: "左へ回す", turnRight: "右へ回す", raise: "床面を奥へ傾ける", lower: "床面を手前へ傾ける", zoomIn: "拡大", zoomOut: "縮小",
      play: "自動回転", playOn: "自動回転を始める", playOff: "自動回転を一時停止する", announcePlay: "自動回転を始めました", announcePause: "自動回転を一時停止しました", reverse: "逆回転", reverseLabel: "逆向きに回す", announceClockwise: "時計回りに回転しています", announceCounterclockwise: "反時計回りに回転しています",
      announce: "{name}の視点", announceAngle: "向きは{yaw}度、見下ろす角度は{pitch}度です。",
      flat: "このブラウザーでは3D表示ができないため、平面の図を表示しています。",
      standing: "3D表示で立って見えるもの：{list}。", item: "{name} {h}", itemSag: "{name} 支柱の位置で{h}（中央は{low}）",
      parts: { scoreboard: "スコアボードの下端", net: "ネット", antennae: "アンテナ", goalposts: "ゴールポスト", netposts: "支柱", hoop: "バスケットゴール", goal: "ゴール", boards: "ボードとガラス", stumps: "ウィケットのスタンプ", pylons: "パイロン", flags: "コーナーフラッグ", fence: "外野フェンス", backstop: "バックネット", "foul-poles": "ファウルポール", "table-legs": "天板", walls: "壁", "starting-blocks": "スタート台", "backstroke-flags": "背泳ぎ用フラッグ", "false-start-rope": "フォルススタートロープ", springboards: "飛板", platforms: "固定台", "judges-stand": "ジャッジ台", hurdles: "ハードル", steeplechase: "障害物", "high-jump": "走高跳の支柱とバー", "pole-vault": "棒高跳の支柱とバー", cage: "円盤投・ハンマー投の囲い", padding: "防護マット", "rink-boards": "フェンス", mound: "土の台", azuchi: "安土", targets: "的", stands: "スタンド", "wall-seats": "壁の上の観客席", roof: "屋根", gallery: "見学席", dais: "上座の台", banner: "垂れ幕", shrine: "神棚", "mat-edge": "畳の厚み", surrounds: "競技エリアのフェンス", officials: "審判席と記録台", judges: "審判員席の名札", deck: "台", "cage-fence": "金網", "cage-posts": "パッド付き支柱", "ring-ropes": "ロープ", "ring-posts": "コーナーポスト", "ribbon-boards": "LEDリボンビジョン", "hung-board": "センターハングビジョン（吊り下げ式スコアボード）", blocks: "周辺の建物" },
    },
    rules: {
      "defensive-zone": "ディフェンディングゾーン",
      "neutral-zone": "ニュートラルゾーン",
      "offensive-zone": "アタッキングゾーン",
      "crease": "ゴールクリース",
      "trapezoid": "ゴールキーパーのトラペゾイド",
      "behind-goal-line": "ゴール裏",
      "inner-slot": "インナースロット",
      "outer-slot": "アウタースロット",
      "slot": "スロット",
      "faceoff-circle": "フェイスオフサークル",
      "centre-circle": "センターサークル",
      "frontcourt": "フロントコート",
      "backcourt": "バックコート",
      "restricted-area": "リストリクテッドエリア",
      "paint": "ペイントエリア",
      "mid-range": "ミッドレンジ",
      "corner-three-left": "左コーナースリー",
      "corner-three-right": "右コーナースリー",
      "above-the-break": "アバブ・ザ・ブレイク・スリー",
      "three-point": "スリーポイントエリア",
      "defensive-third": "ディフェンディングサード",
      "middle-third": "ミドルサード",
      "attacking-third": "アタッキングサード",
      "six-yard-box": "ゴールエリア",
      "own-six-yard-box": "自陣のゴールエリア",
      "penalty-area": "ペナルティエリア",
      "own-penalty-area": "自陣のペナルティエリア",
      "penalty-arc": "ペナルティアーク",
      "own-penalty-arc": "自陣のペナルティアーク",
      "wing-left": "左サイド",
      "half-space-left": "左ハーフスペース",
      "central-corridor": "中央",
      "half-space-right": "右ハーフスペース",
      "wing-right": "右サイド",
      "infield": "内野",
      "outfield": "外野",
      "fair-territory": "フェアグラウンド",
      "foul-territory": "ファウルグラウンド",
      "over-the-wall": "フェンス越え",
      "warning-track": "ウォーニングトラック",
      "left-field": "レフト",
      "centre-field": "センター",
      "right-field": "ライト",
      "third-base-side": "三塁側",
      "middle-infield": "二遊間",
      "first-base-side": "一塁側",
      "own-end-zone": "自陣のエンドゾーン",
      "own-half": "自陣",
      "opponent-half": "敵陣",
      "red-zone": "レッドゾーン",
      "opponent-end-zone": "敵陣のエンドゾーン",
      "end-zone": "エンドゾーン",
      "between-the-hashes": "ハッシュマークの間",
      "outside-hashes-left": "ハッシュマークの外側（左）",
      "outside-hashes-right": "ハッシュマークの外側（右）",
    },
    rulesFiba: { "restricted-area": "ノーチャージセミサークル" },
    target: {
      sports: {"nhl": "アイスホッケーのゴール", "soccer": "サッカーのゴール", "handball": "ハンドボールのゴール", "waterpolo": "水球のゴール", "lacrosse": "ラクロスのゴール", "fieldhockey": "フィールドホッケーのゴール", "cricket": "ウィケット", "mlb": "ストライクゾーン"},
      titleGoal: "ゴールマウス（{name}）：シュートがゴールラインを通過した位置",
      descGoal: "{name}（幅{w}×高さ{h}{unit}）を正面から見た図です。図の左側は、シュートを打つ選手から見た左側です。",
      titleStrike: "ストライクゾーン：投球がホームプレートを通過した位置",
      descStrike: "捕手の位置から見たストライクゾーンです。ホームプレートの幅は{w}インチ、ゾーンの高さは地面から{bottom}〜{top}フィートです。打者は図の{side}側に立ちます。",
      titleStumps: "スタンプ：投球がウィケットに到達した位置",
      descStumps: "ボウラー側から見たスタンプです。3本のスタンプの幅は9インチ（22.86cm）、高さは28インチ（71.12cm）で、ベイルが載っています。",
      left: "左",
      right: "右",
      units: {"m": "メートル", "ft": "フィート", "in": "インチ", "cm": "センチメートル", "yd": "ヤード"},
      outcomes: {"goal": "ゴール", "saved": "セーブ", "post": "ポスト", "crossbar": "クロスバー", "wide": "枠外（横）", "high": "枠外（上）", "blocked": "ブロック", "shot": "シュート", "missed": "外れ", "ball": "ボール", "called-strike": "見逃しストライク", "swinging-strike": "空振りストライク", "foul": "ファウル", "in-play": "インプレー", "hit-by-pitch": "死球", "wicket": "ウィケット", "runs": "得点", "dot": "ドットボール"},
      zones: {"top-left-corner": "左上隅", "top-shelf": "トップシェルフ（ネット上部）", "top-centre": "上段中央", "top-right-corner": "右上隅", "mid-left": "左側", "centre": "中央", "mid-right": "右側", "bottom-left-corner": "左下隅", "five-hole": "ファイブホール（パッドの間）", "bottom-centre": "下段中央", "bottom-right-corner": "右下隅", "wide-left": "枠外（左）", "wide-right": "枠外（右）", "over-the-bar": "バーの上", "zone-1": "ゾーン1", "zone-2": "ゾーン2", "zone-3": "ゾーン3", "zone-4": "ゾーン4", "zone-5": "ゾーン5", "zone-6": "ゾーン6", "zone-7": "ゾーン7", "zone-8": "ゾーン8", "zone-9": "ゾーン9", "zone-11": "ゾーン11（左高め）", "zone-12": "ゾーン12（右高め）", "zone-13": "ゾーン13（左低め）", "zone-14": "ゾーン14（右低め）", "outside": "ゾーンの外", "outside-left": "スタンプの左外", "on-stumps": "スタンプのライン上", "over-stumps": "スタンプの上方", "outside-right": "スタンプの右外"},
      lengths: {"yorker": "ヨーカー", "full": "フルレングス", "good-length": "グッドレングス", "short-of-a-length": "ショート・オブ・ア・レングス", "short": "ショート"},
      pitches: "投球",
      deliveries: "投球",
      numbers: "投球番号",
    },
  },
};

/** Fill {placeholders} in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
