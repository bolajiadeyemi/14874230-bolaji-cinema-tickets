import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import Domain from './domain.js';

export default class TicketService {
  #ticketPaymentService;
  #seatReservationService;
  #domain;

  constructor() {
    this.#ticketPaymentService = new TicketPaymentService();
    this.#seatReservationService = new SeatReservationService();
    this.#domain = new Domain();
  }

  /**
   * Should only have private methods other than the one below.
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#domain.validateAccountId(accountId);
    this.#domain.validateTicketRequests(ticketTypeRequests);

    const {
      totalAmount,
      totalSeats,
      ticketCounts
    } = this.#domain.calculateTotals(ticketTypeRequests);

    this.#domain.applyBusinessRules(ticketCounts);

    try {
      // Make payment and reserve seats
      this.#ticketPaymentService.makePayment(accountId, totalAmount);
      this.#seatReservationService.reserveSeat(accountId, totalSeats);
    } catch (error) {
      throw new InvalidPurchaseException('Payment or seat reservation failed: ' + error.message);
    }

  }


}
