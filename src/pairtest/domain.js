import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import { TICKET_TYPES, defaultConfig } from './config.js';
import TicketTypeRequest from './lib/TicketTypeRequest.js';


export default class Domain {
  #MAX_TICKETS = defaultConfig.maxTickets;
  #TICKET_PRICES = defaultConfig.pricesPence;


  /**
   * Validates business rules for ticket purchases.
   *
   * @param {Object} ticketCounts - Object containing counts for each ticket type
   * @throws {InvalidPurchaseException} When business rules are violated
   * @private
   */
  applyBusinessRules(ticketCounts) {
    this.#checkMaximumTickets(ticketCounts);
    this.#checkAdultSupervision(ticketCounts);
    this.#checkInfantLapSeating(ticketCounts);
  }

  #checkMaximumTickets(ticketCounts) {
    const totalTickets = ticketCounts[TICKET_TYPES.INFANT] +
      ticketCounts[TICKET_TYPES.CHILD] +
      ticketCounts[TICKET_TYPES.ADULT];

    if (totalTickets > this.#MAX_TICKETS) {
      throw new InvalidPurchaseException(`Cannot purchase more than ${this.#MAX_TICKETS} tickets at once`);
    }
  }

  #checkAdultSupervision(ticketCounts) {
    const hasChildOrInfant = ticketCounts[TICKET_TYPES.CHILD] > 0 ||
      ticketCounts[TICKET_TYPES.INFANT] > 0;
    const hasAdult = ticketCounts[TICKET_TYPES.ADULT] > 0;
    if (hasChildOrInfant && !hasAdult) {
      throw new InvalidPurchaseException('Child and Infant tickets cannot be purchased without Adult tickets');
    }
  }
  #checkInfantLapSeating(ticketCounts) {
    if (ticketCounts[TICKET_TYPES.INFANT] > ticketCounts[TICKET_TYPES.ADULT]) {
      throw new InvalidPurchaseException('Cannot have more Infant tickets than Adult tickets (infants sit on adult laps)');
    }
  }

  /**
     * Calculates total amount, seats required, and ticket counts from requests.
     *
     * @param {TicketTypeRequest[]} ticketTypeRequests - Array of ticket requests
     * @returns {{totalAmount: number, totalSeats: number, ticketCounts: Object}} Calculation results
     * @private
     */
  calculateTotals(ticketTypeRequests) {
    let totalAmount = 0;
    let totalSeats = 0;
    const ticketCounts = {
      [TICKET_TYPES.INFANT]: 0,
      [TICKET_TYPES.CHILD]: 0,
      [TICKET_TYPES.ADULT]: 0
    };

    for (const request of ticketTypeRequests) {
      const ticketType = request.getTicketType();

      if (!Object.values(TICKET_TYPES).includes(ticketType)) {
        throw new InvalidPurchaseException(`Unknown ticket type: ${ticketType}`);
      }

      const noOfTickets = request.getNoOfTickets();

      ticketCounts[ticketType] += noOfTickets;
      totalAmount += this.#TICKET_PRICES[ticketType] / 100 * noOfTickets;

      // Infants don't need seats (they sit on adult's lap)
      if (ticketType !== TICKET_TYPES.INFANT) {
        totalSeats += noOfTickets;
      }
    }

    return { totalAmount, totalSeats, ticketCounts };
  }

  /**
* Validates that the account ID is a positive integer.
*
* @param {number} accountId - The account ID to validate
* @throws {InvalidPurchaseException} When account ID is invalid
*/
  validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Account ID must be a positive integer');
    }
  }

  /**
   * Validates that ticket requests are present and properly formed.
   *
   * @param {TicketTypeRequest[]} ticketTypeRequests - Array of ticket requests to validate
   * @throws {InvalidPurchaseException} When requests are missing or invalid
   */
  validateTicketRequests(ticketTypeRequests) {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException('At least one ticket request is required');
    }

    // Validate each request is a TicketTypeRequest instance
    for (const request of ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException('All ticket requests must be TicketTypeRequest instances');
      }

      if (request.getNoOfTickets() <= 0) {
        throw new InvalidPurchaseException('Number of tickets must be greater than 0');
      }
    }
  }
}

