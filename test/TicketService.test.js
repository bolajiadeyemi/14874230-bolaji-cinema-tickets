
import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js';

describe('TicketService', () => {
    describe('purchaseTickets', () => {
        // Input Validation Tests
        it('should throw an error if accountId is not an integer', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets('1', new TicketTypeRequest('ADULT', 1));
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error if accountId is not a positive integer', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(-1, new TicketTypeRequest('ADULT', 1));
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error if no ticket requests are provided', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1);
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error if any ticket request is not an instance of TicketTypeRequest', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1, {});
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error if any ticket request has a non-positive number of tickets', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 0));
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error for unknown ticket type during calculation', () => {
            const ticketService = new TicketService();

            const validRequest = new TicketTypeRequest('ADULT', 1);

            const originalGetTicketType = validRequest.getTicketType;
            validRequest.getTicketType = () => 'UNKNOWN_TYPE';

            expect(() => {
                ticketService.purchaseTickets(1, validRequest);
            }).toThrow('Unknown ticket type: UNKNOWN_TYPE');

            validRequest.getTicketType = originalGetTicketType;
        });
        // Business Rules Tests
        it('should throw an error if more than 25 tickets are requested', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 26));
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error if child tickets are purchased without adult tickets', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 1));
            }).toThrow(InvalidPurchaseException);
        });
        it('should throw an error if infant tickets are purchased without adult tickets', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('INFANT', 1));
            }).toThrow(InvalidPurchaseException);
        });
        it('should allow child and infant tickets when adult tickets are also purchased', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1,
                    new TicketTypeRequest('ADULT', 1),
                    new TicketTypeRequest('CHILD', 1),
                    new TicketTypeRequest('INFANT', 1)
                );
            }).not.toThrow();
        });
        it('should throw an error if there are more infants than adults (infants sit on adult laps)', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1,
                    new TicketTypeRequest('ADULT', 1),
                    new TicketTypeRequest('INFANT', 2)  // 2 infants but only 1 adult
                );
            }).toThrow(InvalidPurchaseException);
        });
        it('should allow equal number of infants and adults', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1,
                    new TicketTypeRequest('ADULT', 2),
                    new TicketTypeRequest('INFANT', 2)  // 2 infants with 2 adults
                );
            }).not.toThrow();
        });
        it('should allow exactly 25 tickets', () => {
            const ticketService = new TicketService();
            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 25));
            }).not.toThrow();
        });

        // Error Handling Tests
        it('should throw InvalidPurchaseException when payment service fails', () => {
            const ticketService = new TicketService();

            // Mock the payment service prototype to throw an error
            const originalMakePayment = TicketPaymentService.prototype.makePayment;
            TicketPaymentService.prototype.makePayment = function () {
                throw new Error('Payment gateway unavailable');
            };

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
            }).toThrow(InvalidPurchaseException);

            TicketPaymentService.prototype.makePayment = originalMakePayment;
        });

        it('should throw InvalidPurchaseException when seat reservation service fails', () => {
            const ticketService = new TicketService();
            const originalReserveSeat = SeatReservationService.prototype.reserveSeat;
            SeatReservationService.prototype.reserveSeat = function () {
                throw new Error('Seat reservation system down');
            };

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
            }).toThrow(InvalidPurchaseException);

            SeatReservationService.prototype.reserveSeat = originalReserveSeat;
        });

        it('should include original error message in InvalidPurchaseException', () => {
            const ticketService = new TicketService();

            const originalMakePayment = TicketPaymentService.prototype.makePayment;
            TicketPaymentService.prototype.makePayment = function () {
                throw new Error('Specific payment error');
            };

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
            }).toThrow('Payment or seat reservation failed: Specific payment error');

            TicketPaymentService.prototype.makePayment = originalMakePayment;
        });
    });

});
