import TicketService from './src/pairtest/TicketService.js';
import TicketTypeRequest from './src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from './src/pairtest/lib/InvalidPurchaseException.js';

/**
 * Cinema Tickets Demo
 * 
 * This demo showcases the TicketService functionality with various scenarios:
 * - Valid purchases
 * - Business rule violations
 * - Error handling
 */

console.log('🎬 Cinema Tickets Service Demo\n');
console.log('='.repeat(50));

const ticketService = new TicketService();

// Demo scenarios
const scenarios = [
  {
    name: '✅ Valid: Adult tickets only',
    accountId: 1001,
    requests: [new TicketTypeRequest('ADULT', 2)],
    expected: 'Success - 2 adults: £50.00, 2 seats'
  },
  {
    name: '✅ Valid: Mixed family booking',
    accountId: 1002,
    requests: [
      new TicketTypeRequest('ADULT', 2),
      new TicketTypeRequest('CHILD', 3),
      new TicketTypeRequest('INFANT', 1)
    ],
    expected: 'Success - 2 adults + 3 children + 1 infant: £95.00, 5 seats'
  },
  {
    name: '✅ Valid: Maximum tickets (25)',
    accountId: 1003,
    requests: [new TicketTypeRequest('ADULT', 25)],
    expected: 'Success - 25 adults: £625.00, 25 seats'
  },
  {
    name: '✅ Valid: Infants equal to adults',
    accountId: 1004,
    requests: [
      new TicketTypeRequest('ADULT', 3),
      new TicketTypeRequest('INFANT', 3)
    ],
    expected: 'Success - 3 adults + 3 infants: £75.00, 3 seats'
  },
  {
    name: '❌ Invalid: Too many tickets (26)',
    accountId: 1005,
    requests: [new TicketTypeRequest('ADULT', 26)],
    expected: 'Error - Exceeds maximum of 25 tickets'
  },
  {
    name: '❌ Invalid: Child without adult',
    accountId: 1006,
    requests: [new TicketTypeRequest('CHILD', 2)],
    expected: 'Error - Child tickets require adult supervision'
  },
  {
    name: '❌ Invalid: More infants than adults',
    accountId: 1007,
    requests: [
      new TicketTypeRequest('ADULT', 1),
      new TicketTypeRequest('INFANT', 2)
    ],
    expected: 'Error - Infants cannot exceed adults (lap seating)'
  },
  {
    name: '❌ Invalid: Zero account ID',
    accountId: 0,
    requests: [new TicketTypeRequest('ADULT', 1)],
    expected: 'Error - Invalid account ID'
  },
  {
    name: '❌ Invalid: Negative account ID',
    accountId: -5,
    requests: [new TicketTypeRequest('ADULT', 1)],
    expected: 'Error - Invalid account ID'
  }
];

// Helper function to calculate expected totals
function calculateExpected(requests) {
  const prices = { ADULT: 25, CHILD: 15, INFANT: 0 };
  let totalCost = 0;
  let totalSeats = 0;
  let summary = [];

  for (const request of requests) {
    const type = request.getTicketType();
    const count = request.getNoOfTickets();
    totalCost += prices[type] * count;

    if (type !== 'INFANT') {
      totalSeats += count;
    }

    const typeName = type.toLowerCase();
    const plural = count > 1 ? (typeName === 'child' ? 'children' : typeName + 's') : typeName;
    summary.push(`${count} ${plural}`);
  }

  return {
    cost: totalCost,
    seats: totalSeats,
    summary: summary.join(' + ')
  };
}

// Run demo scenarios
scenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log('-'.repeat(scenario.name.length + 3));

  try {
    // Attempt the purchase
    ticketService.purchaseTickets(scenario.accountId, ...scenario.requests);

    // If successful, show the details
    const expected = calculateExpected(scenario.requests);
    console.log(`   Account ID: ${scenario.accountId}`);
    console.log(`   Tickets: ${expected.summary}`);
    console.log(`   Total Cost: £${expected.cost.toFixed(2)}`);
    console.log(`   Seats Reserved: ${expected.seats}`);
    console.log(`   ✅ Purchase completed successfully!`);

  } catch (error) {
    if (error instanceof InvalidPurchaseException) {
      console.log(`   Account ID: ${scenario.accountId}`);
      console.log(`   ❌ Purchase failed: ${error.message}`);
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }
});

// Business Rules Summary
console.log('\n' + '='.repeat(50));
console.log('📋 Business Rules Summary');
console.log('='.repeat(50));
console.log('• Adult tickets: £25.00 (gets a seat)');
console.log('• Child tickets: £15.00 (gets a seat, requires adult)');
console.log('• Infant tickets: £0.00 (sits on adult lap, no seat)');
console.log('• Maximum 25 tickets per purchase');
console.log('• Child/Infant tickets require Adult tickets');
console.log('• Infants cannot exceed Adults (lap seating)');
console.log('• Account ID must be a positive integer');

console.log('\n🎭 Demo completed!');
