import type { Language, RangeName, Sport } from "./types.ts";

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
  league: { basketball: string; hockey: string; football: string; baseball: string; softball: string; curling: string; tennis: string; volleyball: string; beachVolleyball: string; badminton: string; pickleball: string; tabletennis: string; size: string; units: { ft: string; yd: string; m: string } };
  /** The net sports' scores: who is serving ({name}), a team's points in each set ({name}, {list}) or game, the points of the game in progress ({name}, {points}), and the heads of the board's columns. */
  net: { serving: string; bySet: string; byGame: string; gamePoints: string; sets: string; games: string; points: string };
  /** The title of a score: placeholders {away}, {awayScore}, {home} and {homeScore}. */
  scoreTitle: string;
  /** The sentences of a description. */
  said: {
    home: string;
    away: string;
    won: string;
    tied: string;
    park: string;
    /** A soccer ground drawn at its published size, or without one: {ground}. */
    ground: string;
    groundDefault: string;
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
      sideLeft: string;
      sideMiddle: string;
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
  ranges: { shows: string; showsEnd: string; box: string; boxFrame: string; cut: string; names: Record<RangeName, string> };
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
    /** The value of the position slider: {t} of {total}. */
    positionValue: string;
    /** What the replay is and the keys it answers to, in smooth motion and in steps. */
    keys: string;
    keysStep: string;
    region: string;
  };
}

/** The words of the package, by language. */
export const KYOGIJO_STRINGS: Record<Language, KyogijoWords> = {
  en: {
    surface: { nfl: "NFL football field", cfl: "CFL football field", ifaf: "IFAF football field", nhl: "NHL hockey rink", nba: "NBA basketball court", mlb: "Baseball field", soccer: "Soccer pitch", curling: "Curling sheet", tennis: "Tennis court", volleyball: "Volleyball court", badminton: "Badminton court", pickleball: "Pickleball court", tabletennis: "Table tennis table" },
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
      size: "{length} by {width} {unit}",
      units: { ft: "feet", yd: "yards", m: "metres" },
    },
    net: { serving: "{name} is serving.", bySet: "By set, {name}: {list}.", byGame: "By game, {name}: {list}.", gamePoints: "In the current game, {name} has {points}.", sets: "Sets", games: "Games", points: "Pts" },
    scoreTitle: "{away} {awayScore}, {home} {homeScore}",
    said: { home: "home", away: "away", won: "{name} won.", tied: "The game is level.", park: "The outfield fence follows the figures published for {park}.", ground: "The pitch follows the size published for {ground}.", groundDefault: "No pitch size is published for {ground}, so the pitch has the international size of 105 by 68 metres.", era: "The markings are those of the {season} season.", hammer: "{name} has the hammer.", ends: "By end, {name}: {list}.", total: "Total", wonPens: "{name} won {a}-{b} on penalties.", pens: "{a}-{b} pens", on: "Drawn as", sep: ", ", stop: ".", colon: ": ", gap: " " },
    charts: {
      titleNba: "NBA shot chart", titleNhl: "NHL shot map", titleMlb: "Baseball spray chart", titleNfl: "NFL pass chart", titleSoccer: "Soccer shot map", titleGoal: "Goal mouth: where the shots crossed the goal line",
      titleCurling: "Curling stones", curlingEnd: "End {n}", curlingStone: "Stone", curlingCounting: "Counting stone", curlingShot: "Shot rock", curlingFrom: "{name}: {d} ft from the button", curlingNoteCounting: "counting", curlingNoteShot: "the shot rock",
      sumCurling: "{n} stones in play. {team} scores {points}.", sumCurlingBlank: "{n} stones in play. No one scores: the end is blanked.", curlingOut: "{n} out of play.",
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
        restricted: "Restricted area", paint: "In the paint (non-RA)", midRange: "Mid-range", cornerLeft: "Left corner 3", cornerRight: "Right corner 3", aboveBreak: "Above the break 3",
        innerSlot: "Inner slot", outerSlot: "Outer slot", offensiveZone: "Offensive zone", behindGoalLine: "Behind the goal line", homePlate: "Home plate", outsideHomePlate: "Outside home plate",
        pull: "Pull", opposite: "Opposite", sprayCentre: "Centre", leftField: "Left field", centreField: "Centre field", rightField: "Right field", infield: "infield", outfield: "outfield",
        lengthShort: "Short", lengthDeep: "Deep", houseButton: "Button", houseFour: "4-foot ring", houseEight: "8-foot ring", houseTwelve: "12-foot ring", guardZone: "Free guard zone", frontCourt: "Front court", backCourt: "Back court", halfCourt: "Half court", sideLeft: "left", sideMiddle: "middle", sideRight: "right",
      },
    },
    team: {
      networkTitle: "Pass network: {players} players, {links} links from {passes} passes", networkNote: "Most touches: {name}, {touches}. Strongest link: {a} and {b}, {n} passes.", networkNoteDirected: "Most touches: {name}, {touches}. Strongest link: {a} to {b}, {n} passes.", networkMin: "Links of fewer than {n} passes are left out.",
      nodeTitle: "{name}: {touches} touches ({made} passes made, {received} received)", linkTitle: "{a} and {b}: {n} passes", linkTitleDirected: "{a} to {b}: {n} passes",
      formationTitle: "Formation {name}: {n} positions", formationNote: "Positions: {list}.", formationPlayers: "Players: {list}.", formationItem: "{who} ({position})",
      voronoiTitle: "Space control of {n} players", voronoiNote: "Share of the surface nearest each team's players: {list}.", shareItem: "{name} {pct}%", voronoiShared: "{n} players share a place with another and have no cell.",
      delaunayTitle: "Delaunay triangulation of {n} players", delaunayNote: "{triangles} triangles and {edges} edges.",
      hullTitle: "Convex hull of {n} players", hullItem: "{name}: {n} players, area {area} square {unit}", hullAll: "all players",
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
        "service-line": "Service line", "centre-service-line": "Centre service line", "singles-sideline": "Singles sideline", "centre-mark": "Centre mark", "attack-line": "Attack line", antenna: "Antenna", "long-service-line": "Long service line", "short-service-line": "Short service line", "non-volley-line": "Non-volley line", "non-volley-zone": "Non-volley zone", "court-net": "Net",
        "hog-line": "Hog line", "tee-line": "Tee line", "back-line": "Back line", house: "House", button: "Button", "centre-line": "Centre line", hack: "Hack", "free-guard-zone": "Free guard zone",
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
        "final-third": "final third", "defensive-third": "defensive third", "middle-third": "middle third", "penalty-area": "penalty area", infield: "infield", outfield: "outfield", sheet: "whole sheet", house: "house",
      },
    },
    replay: {
      title: "Replay, {time}", objects: "{n} tracked objects", objectsOne: "{n} tracked object", events: "{n} events", eventsOne: "{n} event", players: "Players", others: "Ball, puck and officials", trail: "Trail of the last {s} seconds", numbers: "Shirt numbers", eventLines: "Passes and shots",
      home: "home", away: "away", ball: "ball", puck: "puck", official: "official", pass: "Pass", shot: "Shot", goal: "Goal", whistle: "Whistle",
      announce: "{what}, {time}", announceTeam: "{what}, {team}, {time}",
      group: "Replay controls", play: "Play", pause: "Pause", back: "Previous frame", forward: "Next frame", stepBack: "Back", stepForward: "Forward", speed: "Speed", loop: "Loop", position: "Position", time: "Time", event: "Event", positionValue: "{t} of {total}",
      keys: "Replay of the play. Space plays or pauses, the left and right arrow keys step by a frame, Shift with an arrow key moves 5 seconds, and Home and End go to the ends.",
      keysStep: "Replay of the play, in steps. Space or the right arrow key moves on, the left arrow key goes back, and Home and End go to the ends.",
      region: "Replay",
    },
  },
  ja: {
    surface: { nfl: "NFLのフィールド", cfl: "CFLのフィールド", ifaf: "IFAFのフィールド", nhl: "NHLのアイスホッケーリンク", nba: "NBAのバスケットボールコート", mlb: "野球場", soccer: "サッカーのピッチ", curling: "カーリングのシート", tennis: "テニスコート", volleyball: "バレーボールコート", badminton: "バドミントンコート", pickleball: "ピックルボールコート", tabletennis: "卓球台" },
    about: {
      nfl: "アメリカンフットボールのフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      cfl: "カナディアンフットボールのフィールド。20ヤードのエンドゾーンを含めて150ヤード×65ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールライン上のゴールポストがあります",
      ifaf: "国際アメリカンフットボール連盟（IFAF）規格のフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      nhl: "アイスホッケーのリンク。200フィート（約61m）×85フィート（約26m）で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります",
      nba: "バスケットボールのコート。94フィート（約28.7m）×50フィート（約15.2m）で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります",
      mlb: "野球場。塁間90フィート（約27.4m）の内野、マウンド、ファウルライン、外野フェンスがあります",
      soccer: "サッカーのピッチ。{length}m×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティエリアとゴールエリア、ペナルティマークとペナルティアーク、コーナーアーク、ゴールがあります",
      curling: "カーリングのシート。{size}で、両端にハウス（ボタンを囲む12フィート・8フィート・4フィートの円）があり、ティーライン、バックライン、ホッグライン、センターライン、ハックがあります",
      tennis: "テニスコート。78フィート（約23.8m）×36フィート（約11m）で、ベースライン、シングルスとダブルスのサイドライン、サービスライン、センターサービスライン、センターマーク、ネットがあります",
      volleyball: "バレーボールコート。18m×9mで、センターライン、アタックライン、ネットとアンテナがあります",
      badminton: "バドミントンコート。13.4m×6.1mで、シングルスとダブルスのライン、ショートサービスライン、ロングサービスライン、センターライン、ネットがあります",
      pickleball: "ピックルボールコート。44フィート（約13.4m）×20フィート（約6.1m）で、ノンボレーゾーン、センターライン、ネットがあります",
      tabletennis: "卓球台。2.74m×1.525mで、サイドライン、エンドライン、センターライン、ネットがあります",
    },
    status: { final: "試合終了", "final-ot": "試合終了（延長）", "final-so": "試合終了（SO）", "final-aet": "試合終了（延長戦）", "final-pens": "試合終了（PK戦）", live: "試合中", half: "ハーフタイム", "extra-time": "延長戦", "extra-end": "エキストラエンド", penalties: "PK戦", postponed: "延期", tiebreak: "タイブレーク", "match-tiebreak": "マッチタイブレーク", retired: "途中棄権", walkover: "不戦勝" },
    endStatus: "第{n}エンド",
    setStatus: "第{n}セット",
    gameStatus: "第{n}ゲーム",
    soccer: { futsal: "フットサルのコート", aboutFutsal: "フットサルのコート。{length}m×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティエリア、ペナルティマーク、ゴールがあります", half: "半面のみ表示しています。" },
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
      size: "{length}{unit}×{width}{unit}",
      units: { ft: "フィート", yd: "ヤード", m: "m" },
    },
    net: { serving: "{name}のサーブです。", bySet: "{name}のセットごとのスコア：{list}。", byGame: "{name}のゲームごとの得点：{list}。", gamePoints: "現在のゲームのポイントは、{name}が{points}です。", sets: "セット", games: "ゲーム", points: "ポイント" },
    scoreTitle: "{away} {awayScore}、{home} {homeScore}",
    said: { home: "ホーム", away: "アウェイ", won: "{name}の勝ちです。", tied: "同点です。", park: "外野フェンスは、{park}の公表されている距離をもとに描かれています。", ground: "ピッチは、{ground}の公表されている広さをもとに描かれています。", groundDefault: "{ground}のピッチの広さは公表されていないため、国際標準の105×68mで描かれています。", era: "ラインやマークは{season}シーズンのものです。", hammer: "{name}がハンマー（最後の1投）を持っています。", ends: "{name}のエンドごとの得点：{list}。", total: "合計", wonPens: "{name}がPK戦を{a}-{b}で制しました。", pens: "PK戦 {a}-{b}", on: "図の内容", sep: "、", stop: "。", colon: "：", gap: "" },
    charts: {
      titleNba: "NBAのショットチャート", titleNhl: "NHLのシュートマップ", titleMlb: "野球の打球方向図", titleNfl: "NFLのパスチャート", titleSoccer: "サッカーのシュートマップ", titleGoal: "ゴールマウス：シュートがゴールラインを通過した位置",
      titleCurling: "カーリングのストーンの位置", curlingEnd: "第{n}エンド", curlingStone: "ストーン", curlingCounting: "得点になるストーン", curlingShot: "ナンバーワンストーン（ボタンに最も近いストーン）", curlingFrom: "{name}：ボタンから{d}フィート", curlingNoteCounting: "得点になるストーン", curlingNoteShot: "ナンバーワンストーン",
      sumCurling: "プレー中のストーンは{n}個です。{team}が{points}点を取ります。", sumCurlingBlank: "プレー中のストーンは{n}個です。どちらも得点できず、ブランクエンドになります。", curlingOut: "{n}個はプレー外です。",
      shots: "シュート", passes: "パス", balls: "インプレー打球", ballsBeyond: "フェンス越えの打球", lineOfScrimmage: "スクリメージライン", key: "凡例",
      made: "成功", missed: "失敗", missedNet: "枠外", goal: "ゴール", saved: "セーブ", blocked: "ブロック", shot: "シュート", post: "ポスト直撃",
      single: "単打", double: "二塁打", triple: "三塁打", homeRun: "本塁打", out: "アウト", complete: "パス成功", incomplete: "パス不成功", touchdown: "タッチダウン", interception: "インターセプト",
      sizeXg: "大きさ：xG", sizeNote: "マークの大きさは、そのシュートの期待ゴール数（xG）を表します。", xgTotal: "xG合計 {n}",
      fgRate: "フィールドゴール成功率（％）", completionRate: "パス成功率（％）", goalRate: "シュート決定率（％）", xgStat: "期待ゴール数（xG）", hitRate: "安打の割合（インプレー打球に対する％）",
      leagueNote: "ゾーンの色は、リーグ平均{league}％との差を表します。",
      sumNba: "シュート{shots}本、成功{made}本（{pct}％）。", sumShots: "シュート{shots}本、{goals}ゴール。", sumShotsXg: "シュート{shots}本、{goals}ゴール、期待ゴール数（xG）{xg}。",
      sumMlb: "インプレー打球{balls}本：{list}。", sumNfl: "パス{passes}本、成功{complete}本（{pct}％）、タッチダウン{td}回、インターセプト{int}回。",
      beyondNote: "フェンスを越えた打球は{n}本です。", airYards: "エアヤード：{min}～{max}ヤード。",
      goalDesc: "ゴール枠（幅{w}m×高さ{h}m）を正面から見た図です。図の左側が、シュートを打つ選手の左手側です。",
      titlePassNetwork: "パスネットワーク", sizeTouches: "円の大きさ：タッチ数", widthPasses: "線の太さ：パス数", sumNetwork: "パス{passes}本、選手{players}人、つながり{links}本。",
    },
    layers: {
      pointOne: "データ点", pointMany: "データ点", lineOne: "線", lineMany: "線", arrowOne: "矢印", arrowMany: "矢印", textOne: "ラベル", textMany: "ラベル",
      count: "{noun} {n}件", item: "{name} {n}件", listSep: "、", outcomes: "結果別：{list}。", teams: "チーム別：{list}。", values: "値の範囲：{min}～{max}。", skipped: "位置が不明なため{n}件は描かれていません。", data: "データ",
      tableNo: "番号", tableX: "x", tableY: "y", tableToX: "終点のx", tableToY: "終点のy", tablePath: "経路", tableValue: "値", tableTeam: "チーム", tableOutcome: "結果", tableNote: "備考", tableText: "ラベル",
      tableFrame: "座標系：{frame}、単位：{unit}。", tableMore: "全{total}行のうち先頭の{shown}行を表示しています。",
      heatTitle: "{noun}のヒートマップ（{n}件）", hexTitle: "{noun}の六角形ビン図（{n}件）", zonesTitle: "{noun}のゾーン別集計（{n}件）", contourTitle: "{noun}の密度等高線（{n}件）", legendTitle: "凡例：{name}",
      range: "{min}～{max}", heatNote: "{n}個のセルの{stat}は{min}～{max}です。", hexNote: "{n}個の六角形の{stat}は{min}～{max}です。", zoneNote: "{n}個のゾーンの{stat}は{min}～{max}です。", contourNote: "密度の等高線は{n}本です。ピークは({x}, {y})付近です。",
      top: "上位：{list}。", outside: "グリッドまたはゾーンの範囲外のデータが{n}件あります。",
      stat: { count: "件数", sum: "合計", mean: "平均", median: "中央値", percent: "全体に占める割合（％）", max: "最大", min: "最小", rate: "成功率（％）", custom: "値", density: "密度（ピークに対する割合、％）", mass: "内側に含まれるデータの割合（％）" },
      tableZone: "ゾーン", tableCount: "件数", tableShare: "割合（％）", tableLevel: "レベル", tableCell: "セル", tableCells: "{stat}。各セルの中心の位置です。座標系：{frame}、単位：{unit}。", tableCellsPlain: "{stat}。各セルの中心の位置です。単位：{unit}。", valueItem: "{name}（{n}）",
      zones: {
        pair: "{a}・{b}", atEnd: "{name}（{end}）", endLeft: "左ゴール側", endRight: "右ゴール側", band: "{n}列目", zone: "ゾーン{n}",
        wingLeft: "左サイド", halfLeft: "左ハーフスペース", laneCentre: "中央", halfRight: "右ハーフスペース", wingRight: "右サイド",
        defensiveThird: "ディフェンディングサード", middleThird: "ミドルサード", attackingThird: "アタッキングサード",
        restricted: "リストリクテッドエリア", paint: "ペイント内（リストリクテッドエリア外）", midRange: "ミッドレンジ", cornerLeft: "左コーナー3", cornerRight: "右コーナー3", aboveBreak: "アバブ・ザ・ブレイク3",
        innerSlot: "内側スロット", outerSlot: "外側スロット", offensiveZone: "アタッキングゾーン", behindGoalLine: "ゴールライン後方", homePlate: "ゴール前の五角形エリア", outsideHomePlate: "五角形エリアの外",
        pull: "引っ張り方向", opposite: "逆方向", sprayCentre: "センター方向", leftField: "レフト方向", centreField: "センター方向", rightField: "ライト方向", infield: "内野", outfield: "外野",
        lengthShort: "ショートパス", lengthDeep: "ディープパス", houseButton: "ボタン", houseFour: "4フィートの円", houseEight: "8フィートの円", houseTwelve: "12フィートの円", guardZone: "フリーガードゾーン", frontCourt: "フロントコート", backCourt: "バックコート", halfCourt: "ハーフコート", sideLeft: "左", sideMiddle: "中央", sideRight: "右",
      },
    },
    team: {
      networkTitle: "パスネットワーク：選手{players}人、つながり{links}本（パス{passes}本）", networkNote: "最多タッチ：{name}（{touches}回）。パスが最も多いつながり：{a}と{b}、{n}本。", networkNoteDirected: "最多タッチ：{name}（{touches}回）。パスが最も多いつながり：{a}から{b}へ、{n}本。", networkMin: "パスが{n}本未満のつながりは描かれていません。",
      nodeTitle: "{name}：タッチ{touches}回（出したパス{made}本、受けたパス{received}本）", linkTitle: "{a}と{b}：パス{n}本", linkTitleDirected: "{a}から{b}へ：パス{n}本",
      formationTitle: "フォーメーション{name}：{n}人分のポジション", formationNote: "ポジション：{list}。", formationPlayers: "選手：{list}。", formationItem: "{who}（{position}）",
      voronoiTitle: "選手{n}人のスペース支配（ボロノイ図）", voronoiNote: "競技場のうち、各チームの選手が最も近い範囲の割合：{list}。", shareItem: "{name} {pct}％", voronoiShared: "{n}人は他の選手と同じ位置にいるため、エリアがありません。",
      delaunayTitle: "選手{n}人のドロネー三角形分割", delaunayNote: "三角形{triangles}個、辺{edges}本。",
      hullTitle: "選手{n}人の凸包", hullItem: "{name}：選手{n}人、面積{area}平方{unit}", hullAll: "全選手",
      flowTitle: "{n}件の移動の流れ（{cells}個のセル）", flowNote: "セルごとの平均的な移動の長さは最大で{len}{unit}です。",
      sonarTitle: "{n}件の移動の方向別分布：ローズ図{roses}個（各{angles}方向）", sonarNote: "最も多い方向：{deg}度（{n}件）。", sonarAngles: "競技場を横長に描いたとき、0度は右端の方向、90度は上辺の方向です。", roseTitle: "{name}：{n}件の移動、最も多いのは{deg}度方向", barTitle: "{from}度～{to}度：{value}",
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
        "home-plate": "ホームベース", "first-base": "一塁", "second-base": "二塁", "third-base": "三塁", "foul-line": "ファウルライン", "outfield-fence": "外野フェンス", "warning-track": "ウォーニングトラック", "pitchers-plate": "投手板", "batters-box": "バッターボックス",
        touchline: "タッチライン", "penalty-area": "ペナルティエリア", "goal-area": "ゴールエリア", "penalty-mark": "ペナルティマーク", "penalty-arc": "ペナルティアーク", "corner-arc": "コーナーアーク", goal: "ゴール",
        "service-line": "サービスライン", "centre-service-line": "センターサービスライン", "singles-sideline": "シングルスサイドライン", "centre-mark": "センターマーク", "attack-line": "アタックライン", antenna: "アンテナ", "long-service-line": "ロングサービスライン", "short-service-line": "ショートサービスライン", "non-volley-line": "ノンボレーライン", "non-volley-zone": "ノンボレーゾーン", "court-net": "ネット",
        "hog-line": "ホッグライン", "tee-line": "ティーライン", "back-line": "バックライン", house: "ハウス", button: "ボタン", "centre-line": "センターライン", hack: "ハック", "free-guard-zone": "フリーガードゾーン",
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
        "final-third": "アタッキングサード", "defensive-third": "ディフェンディングサード", "middle-third": "ミドルサード", "penalty-area": "ペナルティエリア", infield: "内野", outfield: "外野", sheet: "シート全体", house: "ハウス",
      },
    },
    replay: {
      title: "リプレイ（再生時間{time}）", objects: "追跡対象は{n}個", objectsOne: "追跡対象は{n}個", events: "イベント{n}件", eventsOne: "イベント{n}件", players: "選手", others: "ボール・パック・審判", trail: "直近{s}秒の軌跡", numbers: "背番号", eventLines: "パスとシュート",
      home: "ホーム", away: "アウェイ", ball: "ボール", puck: "パック", official: "審判", pass: "パス", shot: "シュート", goal: "ゴール", whistle: "ホイッスル",
      announce: "{what}、{time}", announceTeam: "{team}の{what}、{time}",
      group: "リプレイの操作", play: "再生", pause: "一時停止", back: "前のコマ", forward: "次のコマ", stepBack: "前へ", stepForward: "次へ", speed: "再生速度", loop: "繰り返し", position: "再生位置", time: "時間", event: "イベント", positionValue: "{total}中{t}",
      keys: "プレーのリプレイです。スペースキーで再生と一時停止、左右の矢印キーで1コマずつ前後に移動、Shiftキーを押しながら矢印キーで5秒ずつ移動、Homeキーで最初、Endキーで最後に移動します。",
      keysStep: "プレーのリプレイです。コマ送りで表示しています。スペースキーまたは右矢印キーで進み、左矢印キーで戻り、Homeキーで最初、Endキーで最後に移動します。",
      region: "リプレイ",
    },
  },
};

/** Fill {placeholders} in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
