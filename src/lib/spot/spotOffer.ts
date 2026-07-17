/**
 * Ada Spot — the offer, as told to a visitor who hasn't run a read yet.
 *
 * The live values come from the server (`SpotUpsell.price_usd` /
 * `.max_photos`) once a read has happened. Before that — on the landing
 * page a cold QR scan hits — there is no upsell payload to read from, so
 * the page has to state the offer from a constant. These are that
 * constant, and they double as the fallback the upsell card already used
 * inline. One source, so the pitch above the fold and the card below the
 * read can't quietly disagree.
 */

/** Price of the full multi-angle report, in USD. */
export const SPOT_DEFAULT_PRICE_USD = 79;

/** Photos a buyer may submit against one paid report. */
export const SPOT_DEFAULT_MAX_PHOTOS = 10;
