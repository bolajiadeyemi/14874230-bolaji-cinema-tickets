import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

export default class TicketService {
  #ticketPaymentService;
  #seatReservationService;
  static #TICKET_TYPES = {
    INFANT: 'INFANT',
    CHILD: 'CHILD',
    ADULT: 'ADULT'
  };

  #TICKET_PRICES = {
    [TicketService.#TICKET_TYPES.INFANT]: 0,
    [TicketService.#TICKET_TYPES.CHILD]: 15,
    [TicketService.#TICKET_TYPES.ADULT]: 25
  };

  #MAX_TICKETS = 25;

  constructor() {
    this.#ticketPaymentService = new TicketPaymentService();
    this.#seatReservationService = new SeatReservationService();
  }

  /**
   * Should only have private methods other than the one below.
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId);
    this.#validateTicketRequests(ticketTypeRequests);

    const { totalAmount, totalSeats, ticketCounts } = this.#calculateTotals(ticketTypeRequests);

    this.#applyBusinessRules(ticketCounts);

    try {
      // Make payment and reserve seats
      this.#ticketPaymentService.makePayment(accountId, totalAmount);
      this.#seatReservationService.reserveSeat(accountId, totalSeats);
    } catch (error) {
      throw new InvalidPurchaseException('Payment or seat reservation failed: ' + error.message);
    }

  }

  /**
 * Validates that the account ID is a positive integer.
 *
 * @param {number} accountId - The account ID to validate
 * @throws {InvalidPurchaseException} When account ID is invalid
 * @private
 */
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Account ID must be a positive integer');
    }
  }

  /**
   * Validates that ticket requests are present and properly formed.
   *
   * @param {TicketTypeRequest[]} ticketTypeRequests - Array of ticket requests to validate
   * @throws {InvalidPurchaseException} When requests are missing or invalid
   * @private
   */
  #validateTicketRequests(ticketTypeRequests) {
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

  /**
   * Calculates total amount, seats required, and ticket counts from requests.
   *
   * @param {TicketTypeRequest[]} ticketTypeRequests - Array of ticket requests
   * @returns {{totalAmount: number, totalSeats: number, ticketCounts: Object}} Calculation results
   * @private
   */
  #calculateTotals(ticketTypeRequests) {
    let totalAmount = 0;
    let totalSeats = 0;
    const ticketCounts = {
      [TicketService.#TICKET_TYPES.INFANT]: 0,
      [TicketService.#TICKET_TYPES.CHILD]: 0,
      [TicketService.#TICKET_TYPES.ADULT]: 0
    };

    for (const request of ticketTypeRequests) {
      const ticketType = request.getTicketType();

      if (!Object.values(TicketService.#TICKET_TYPES).includes(ticketType)) {
        throw new InvalidPurchaseException(`Unknown ticket type: ${ticketType}`);
      }

      const noOfTickets = request.getNoOfTickets();

      ticketCounts[ticketType] += noOfTickets;
      totalAmount += this.#TICKET_PRICES[ticketType] * noOfTickets;

      // Infants don't need seats (they sit on adult's lap)
      if (ticketType !== TicketService.#TICKET_TYPES.INFANT) {
        totalSeats += noOfTickets;
      }
    }

    return { totalAmount, totalSeats, ticketCounts };
  }

  /**
   * Validates business rules for ticket purchases.
   *
   * @param {Object} ticketCounts - Object containing counts for each ticket type
   * @throws {InvalidPurchaseException} When business rules are violated
   * @private
   */
  #applyBusinessRules(ticketCounts) {
    const totalTickets = ticketCounts[TicketService.#TICKET_TYPES.INFANT] +
      ticketCounts[TicketService.#TICKET_TYPES.CHILD] +
      ticketCounts[TicketService.#TICKET_TYPES.ADULT];

    // Check maximum ticket limit
    if (totalTickets > this.#MAX_TICKETS) {
      throw new InvalidPurchaseException(`Cannot purchase more than ${this.#MAX_TICKETS} tickets at once`);
    }

    // Check that child and infant tickets are accompanied by adult tickets
    const hasChildOrInfant = ticketCounts[TicketService.#TICKET_TYPES.CHILD] > 0 ||
      ticketCounts[TicketService.#TICKET_TYPES.INFANT] > 0;
    const hasAdult = ticketCounts[TicketService.#TICKET_TYPES.ADULT] > 0;

    if (hasChildOrInfant && !hasAdult) {
      throw new InvalidPurchaseException('Child and Infant tickets cannot be purchased without Adult tickets');
    }

    // Check that there are enough adults for infants (assuming 1 infant per adult max)
    if (ticketCounts[TicketService.#TICKET_TYPES.INFANT] > ticketCounts[TicketService.#TICKET_TYPES.ADULT]) {
      throw new InvalidPurchaseException('Cannot have more Infant tickets than Adult tickets (infants sit on adult laps)');
    }
  }
}
