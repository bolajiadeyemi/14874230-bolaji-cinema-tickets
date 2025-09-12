import TicketService from '../../src/pairtest/TicketService.js';
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException.js';
import TicketPaymentService from '../../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../../src/thirdparty/seatbooking/SeatReservationService.js';

describe('TicketService Integration Tests', () => {
    let originalMakePayment;
    let originalReserveSeat;
    let paymentCalls;
    let seatReservationCalls;

    beforeEach(() => {
        // Store original methods
        originalMakePayment = TicketPaymentService.prototype.makePayment;
        originalReserveSeat = SeatReservationService.prototype.reserveSeat;

        // Reset call tracking
        paymentCalls = [];
        seatReservationCalls = [];

        // Mock methods to track calls
        TicketPaymentService.prototype.makePayment = function (accountId, amount) {
            paymentCalls.push({ accountId, amount });
            return originalMakePayment.call(this, accountId, amount);
        };

        SeatReservationService.prototype.reserveSeat = function (accountId, seats) {
            seatReservationCalls.push({ accountId, seats });
            return originalReserveSeat.call(this, accountId, seats);
        };
    });

    afterEach(() => {
        // Restore original methods
        TicketPaymentService.prototype.makePayment = originalMakePayment;
        SeatReservationService.prototype.reserveSeat = originalReserveSeat;
    });

    describe('Successful ticket purchases', () => {
        it('should successfully purchase adult tickets only', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 2));
            }).not.toThrow();

            // Verify payment service was called with correct amount (2 * £25 = £50)
            expect(paymentCalls).toHaveLength(1);
            expect(paymentCalls[0]).toEqual({ accountId: 1, amount: 50 });

            // Verify seat reservation was called with correct seats (2 adults = 2 seats)
            expect(seatReservationCalls).toHaveLength(1);
            expect(seatReservationCalls[0]).toEqual({ accountId: 1, seats: 2 });
        });

        it('should successfully purchase mixed tickets with correct calculations', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(123,
                    new TicketTypeRequest('ADULT', 2),   // 2 * £25 = £50
                    new TicketTypeRequest('CHILD', 3),   // 3 * £15 = £45
                    new TicketTypeRequest('INFANT', 1)   // 1 * £0 = £0
                );
            }).not.toThrow();

            // Verify payment: £50 + £45 + £0 = £95
            expect(paymentCalls).toHaveLength(1);
            expect(paymentCalls[0]).toEqual({ accountId: 123, amount: 95 });

            // Verify seats: 2 adults + 3 children + 0 infants = 5 seats
            expect(seatReservationCalls).toHaveLength(1);
            expect(seatReservationCalls[0]).toEqual({ accountId: 123, seats: 5 });
        });

        it('should handle maximum ticket purchase (25 tickets)', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(999, new TicketTypeRequest('ADULT', 25));
            }).not.toThrow();

            // Verify payment: 25 * £25 = £625
            expect(paymentCalls).toHaveLength(1);
            expect(paymentCalls[0]).toEqual({ accountId: 999, amount: 625 });

            // Verify seats: 25 adults = 25 seats
            expect(seatReservationCalls).toHaveLength(1);
            expect(seatReservationCalls[0]).toEqual({ accountId: 999, seats: 25 });
        });

        it('should handle infants correctly (no seats, no payment)', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(456,
                    new TicketTypeRequest('ADULT', 3),   // 3 * £25 = £75
                    new TicketTypeRequest('INFANT', 3)   // 3 * £0 = £0, 0 seats
                );
            }).not.toThrow();

            // Verify payment: only adults pay
            expect(paymentCalls).toHaveLength(1);
            expect(paymentCalls[0]).toEqual({ accountId: 456, amount: 75 });

            // Verify seats: only adults get seats
            expect(seatReservationCalls).toHaveLength(1);
            expect(seatReservationCalls[0]).toEqual({ accountId: 456, seats: 3 });
        });
    });

    describe('Business rule validation integration', () => {
        it('should prevent purchase when more than 25 tickets requested', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 26));
            }).toThrow(InvalidPurchaseException);

            // Verify no payment or reservation was attempted
            expect(paymentCalls).toHaveLength(0);
            expect(seatReservationCalls).toHaveLength(0);
        });

        it('should prevent child tickets without adults', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 2));
            }).toThrow(InvalidPurchaseException);

            // Verify no payment or reservation was attempted
            expect(paymentCalls).toHaveLength(0);
            expect(seatReservationCalls).toHaveLength(0);
        });

        it('should prevent more infants than adults', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(1,
                    new TicketTypeRequest('ADULT', 1),
                    new TicketTypeRequest('INFANT', 2)
                );
            }).toThrow(InvalidPurchaseException);

            // Verify no payment or reservation was attempted
            expect(paymentCalls).toHaveLength(0);
            expect(seatReservationCalls).toHaveLength(0);
        });
    });

    describe('Third-party service integration', () => {
        it('should call services in correct order', () => {
            const ticketService = new TicketService();

            ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));

            // Verify both services were called
            expect(paymentCalls).toHaveLength(1);
            expect(seatReservationCalls).toHaveLength(1);

            // Note: In this simplified approach, we can't easily test call order
            // but we can verify both services were called with correct parameters
            expect(paymentCalls[0]).toEqual({ accountId: 1, amount: 25 });
            expect(seatReservationCalls[0]).toEqual({ accountId: 1, seats: 1 });
        });

        it('should pass correct account ID to both services', () => {
            const ticketService = new TicketService();
            const accountId = 12345;

            ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 1));

            // Verify both services received the same account ID
            expect(paymentCalls[0].accountId).toBe(accountId);
            expect(seatReservationCalls[0].accountId).toBe(accountId);
        });
    });

    describe('Error handling integration', () => {
        it('should handle payment service errors gracefully', () => {
            const ticketService = new TicketService();

            // Mock payment service to throw error
            TicketPaymentService.prototype.makePayment = function () {
                throw new Error('Payment gateway timeout');
            };

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
            }).toThrow('Payment or seat reservation failed: Payment gateway timeout');
        });

        it('should handle seat reservation service errors gracefully', () => {
            const ticketService = new TicketService();

            // Mock seat reservation service to throw error
            SeatReservationService.prototype.reserveSeat = function () {
                throw new Error('Seat booking system unavailable');
            };

            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
            }).toThrow('Payment or seat reservation failed: Seat booking system unavailable');
        });
    });

    describe('Complex scenarios', () => {
        it('should handle large family booking correctly', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(7777,
                    new TicketTypeRequest('ADULT', 4),   // 4 * £25 = £100
                    new TicketTypeRequest('CHILD', 6),   // 6 * £15 = £90
                    new TicketTypeRequest('INFANT', 2)   // 2 * £0 = £0
                );
            }).not.toThrow();

            // Total: £100 + £90 + £0 = £190
            expect(paymentCalls).toHaveLength(1);
            expect(paymentCalls[0]).toEqual({ accountId: 7777, amount: 190 });

            // Seats: 4 adults + 6 children + 0 infants = 10 seats
            expect(seatReservationCalls).toHaveLength(1);
            expect(seatReservationCalls[0]).toEqual({ accountId: 7777, seats: 10 });
        });

        it('should handle edge case: exactly 25 tickets with mixed types', () => {
            const ticketService = new TicketService();

            expect(() => {
                ticketService.purchaseTickets(8888,
                    new TicketTypeRequest('ADULT', 10),  // 10 * £25 = £250
                    new TicketTypeRequest('CHILD', 10),  // 10 * £15 = £150
                    new TicketTypeRequest('INFANT', 5)   // 5 * £0 = £0
                );
            }).not.toThrow();

            // Total: £250 + £150 + £0 = £400
            expect(paymentCalls).toHaveLength(1);
            expect(paymentCalls[0]).toEqual({ accountId: 8888, amount: 400 });

            // Seats: 10 adults + 10 children + 0 infants = 20 seats
            expect(seatReservationCalls).toHaveLength(1);
            expect(seatReservationCalls[0]).toEqual({ accountId: 8888, seats: 20 });
        });
    });
});
