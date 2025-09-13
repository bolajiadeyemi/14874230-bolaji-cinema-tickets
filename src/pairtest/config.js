/**
 * Ticket type constants.
 */
export const TICKET_TYPES = Object.freeze({
  INFANT: 'INFANT',
  CHILD: 'CHILD',
  ADULT: 'ADULT'
});

/**
 * Default configuration for the ticket service.
 * All prices are in pence to avoid floating point arithmetic issues.
 */
export const defaultConfig = Object.freeze({
  // Ticket prices in pence (to avoid floating point issues)
  pricesPence: Object.freeze({
    [TICKET_TYPES.INFANT]: process.env.INFANT_PRICE_PENCE || 0,     // £0.00
    [TICKET_TYPES.CHILD]: process.env.CHILD_PRICE_PENCE || 1500,   // £15.00
    [TICKET_TYPES.ADULT]: process.env.ADULT_PRICE_PENCE || 2500    // £25.00
  }),

  // Business rule limits
  maxTickets: process.env.MAX_TICKETS || 25
});
