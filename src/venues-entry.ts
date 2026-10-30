// The real venues of the NHL's arenas: the outline of each building and the way its rink lies (OpenStreetMap, ODbL 1.0) and a plausible bowl from the seats, tiers and roof the sources give (Wikidata, Wikipedia).
import "./full.ts";
export { VENUE_ATTRIBUTION, VENUE_CONFERENCES, VENUE_DIVISIONS, VENUE_IDS, VENUES, arenaOfVenue, bowlInside, conferenceOf, planVenue, venueBowl, venueById, venueByWikidata, venueOrientation, venueRink, venuesIn, venuesInConference } from "./venues.ts";
export type { RealVenue, RealVenueData, VenueBasis, VenueConference, VenueDivision, VenueOrientation, VenueOsm, VenuePlan, VenueRoof } from "./venues.ts";
