import Domain from '../src/pairtest/domain.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';
import { TICKET_TYPES } from '../src/pairtest/config.js';

describe('Domain', () => {
  let domain;

  beforeEach(() => {
    domain = new Domain();
  });

  describe('validateAccountId', () => {
    it('should accept positive integers', () => {
      expect(() => {
        domain.validateAccountId(1);
      }).not.toThrow();

      expect(() => {
        domain.validateAccountId(12345);
      }).not.toThrow();
    });

    it('should reject zero', () => {
      expect(() => {
        domain.validateAccountId(0);
      }).toThrow(InvalidPurchaseException);
    });

    it('should reject negative numbers', () => {
      expect(() => {
        domain.validateAccountId(-1);
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        domain.validateAccountId(-100);
      }).toThrow(InvalidPurchaseException);
    });

    it('should reject non-integers', () => {
      expect(() => {
        domain.validateAccountId(1.5);
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        domain.validateAccountId('1');
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        domain.validateAccountId(null);
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        domain.validateAccountId(undefined);
      }).toThrow(InvalidPurchaseException);
    });
  });

  describe('validateTicketRequests', () => {
    it('should accept valid ticket requests', () => {
      const requests = [
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('CHILD', 1)
      ];

      expect(() => {
        domain.validateTicketRequests(requests);
      }).not.toThrow();
    });

    it('should reject empty request arrays', () => {
      expect(() => {
        domain.validateTicketRequests([]);
      }).toThrow(InvalidPurchaseException);
    });

    it('should reject null or undefined requests', () => {
      expect(() => {
        domain.validateTicketRequests(null);
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        domain.validateTicketRequests(undefined);
      }).toThrow(InvalidPurchaseException);
    });

    it('should reject non-TicketTypeRequest objects', () => {
      expect(() => {
        domain.validateTicketRequests([{}]);
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        domain.validateTicketRequests([{ type: 'ADULT', count: 1 }]);
      }).toThrow(InvalidPurchaseException);
    });

    it('should reject requests with zero or negative ticket counts', () => {
      const zeroTicketRequest = new TicketTypeRequest('ADULT', 1);
      // Override the getNoOfTickets method to return 0
      zeroTicketRequest.getNoOfTickets = () => 0;

      expect(() => {
        domain.validateTicketRequests([zeroTicketRequest]);
      }).toThrow(InvalidPurchaseException);

      const negativeTicketRequest = new TicketTypeRequest('ADULT', 1);
      negativeTicketRequest.getNoOfTickets = () => -1;

      expect(() => {
        domain.validateTicketRequests([negativeTicketRequest]);
      }).toThrow(InvalidPurchaseException);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate totals for adult tickets only', () => {
      const requests = [new TicketTypeRequest('ADULT', 2)];
      const result = domain.calculateTotals(requests);

      expect(result.totalAmount).toBe(50); // 2 * £25
      expect(result.totalSeats).toBe(2);
      expect(result.ticketCounts[TICKET_TYPES.ADULT]).toBe(2);
      expect(result.ticketCounts[TICKET_TYPES.CHILD]).toBe(0);
      expect(result.ticketCounts[TICKET_TYPES.INFANT]).toBe(0);
    });

    it('should calculate totals for mixed ticket types', () => {
      const requests = [
        new TicketTypeRequest('ADULT', 2),   // 2 * £25 = £50
        new TicketTypeRequest('CHILD', 3),   // 3 * £15 = £45
        new TicketTypeRequest('INFANT', 1)   // 1 * £0 = £0
      ];
      const result = domain.calculateTotals(requests);

      expect(result.totalAmount).toBe(95); // £50 + £45 + £0
      expect(result.totalSeats).toBe(5);   // 2 adults + 3 children (infants don't get seats)
      expect(result.ticketCounts[TICKET_TYPES.ADULT]).toBe(2);
      expect(result.ticketCounts[TICKET_TYPES.CHILD]).toBe(3);
      expect(result.ticketCounts[TICKET_TYPES.INFANT]).toBe(1);
    });

    it('should handle infants correctly (no seats, no payment)', () => {
      const requests = [
        new TicketTypeRequest('ADULT', 1),
        new TicketTypeRequest('INFANT', 2)
      ];
      const result = domain.calculateTotals(requests);

      expect(result.totalAmount).toBe(25); // Only adult pays
      expect(result.totalSeats).toBe(1);   // Only adult gets seat
      expect(result.ticketCounts[TICKET_TYPES.ADULT]).toBe(1);
      expect(result.ticketCounts[TICKET_TYPES.INFANT]).toBe(2);
    });

    it('should throw error for unknown ticket types', () => {
      const invalidRequest = new TicketTypeRequest('ADULT', 1);
      invalidRequest.getTicketType = () => 'UNKNOWN_TYPE';

      expect(() => {
        domain.calculateTotals([invalidRequest]);
      }).toThrow('Unknown ticket type: UNKNOWN_TYPE');
    });

    it('should accumulate multiple requests of same type', () => {
      const requests = [
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('ADULT', 3)
      ];
      const result = domain.calculateTotals(requests);

      expect(result.totalAmount).toBe(125); // 5 * £25
      expect(result.totalSeats).toBe(5);
      expect(result.ticketCounts[TICKET_TYPES.ADULT]).toBe(5);
    });
  });

  describe('applyBusinessRules', () => {
    it('should pass for valid ticket combinations', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 2,
        [TICKET_TYPES.CHILD]: 1,
        [TICKET_TYPES.INFANT]: 1
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).not.toThrow();
    });

    it('should reject more than 25 tickets total', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 26,
        [TICKET_TYPES.CHILD]: 0,
        [TICKET_TYPES.INFANT]: 0
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).toThrow('Cannot purchase more than 25 tickets at once');
    });

    it('should reject child tickets without adults', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 0,
        [TICKET_TYPES.CHILD]: 1,
        [TICKET_TYPES.INFANT]: 0
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).toThrow('Child and Infant tickets cannot be purchased without Adult tickets');
    });

    it('should reject infant tickets without adults', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 0,
        [TICKET_TYPES.CHILD]: 0,
        [TICKET_TYPES.INFANT]: 1
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).toThrow('Child and Infant tickets cannot be purchased without Adult tickets');
    });

    it('should reject more infants than adults', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 1,
        [TICKET_TYPES.CHILD]: 0,
        [TICKET_TYPES.INFANT]: 2
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).toThrow('Cannot have more Infant tickets than Adult tickets (infants sit on adult laps)');
    });

    it('should allow equal infants and adults', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 2,
        [TICKET_TYPES.CHILD]: 0,
        [TICKET_TYPES.INFANT]: 2
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).not.toThrow();
    });

    it('should allow exactly 25 tickets', () => {
      const ticketCounts = {
        [TICKET_TYPES.ADULT]: 25,
        [TICKET_TYPES.CHILD]: 0,
        [TICKET_TYPES.INFANT]: 0
      };

      expect(() => {
        domain.applyBusinessRules(ticketCounts);
      }).not.toThrow();
    });
  });
});
