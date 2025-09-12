
import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

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
    });

});
