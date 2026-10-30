// The real stadiums and ballparks: the outline of each building and the way its field lies (OpenStreetMap, ODbL 1.0) and a plausible bowl from the seats of each configuration, the bowls and the roof the sources give (Wikidata, Wikipedia).
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { VENUE_ATTRIBUTION, STADIUMS, STADIUM_IDS, groundOfStadium, planPark, planStadium, stadiumBowl, stadiumBowlInside, stadiumById, stadiumByWikidata, stadiumConfigOf, stadiumConfigs, stadiumFrameHeading, stadiumKind, stadiumNames, stadiumOrientation, stadiumSeats } from "./stadiums.ts";
export type { ParkPlan, RealStadium, RealStadiumData, StadiumBasis, StadiumConfigData, StadiumConfigId, StadiumKind, StadiumOrientation, StadiumOsm, StadiumPlan, StadiumRoof } from "./stadiums.ts";
