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

import { MAX_PAID_PHOTOS } from './uploadGate.js';

/** Price of the full multi-angle report, in USD. */
export const SPOT_DEFAULT_PRICE_USD = 79;

/**
 * Photos a buyer may submit against one paid report. Re-exported from the
 * upload gate rather than declared here: the display and the enforced limit
 * are the SAME number, and they drifted once already — the page promised 10
 * while the server refused past 5. One source now.
 */
export const SPOT_DEFAULT_MAX_PHOTOS = MAX_PAID_PHOTOS;
