import TicketService from './src/pairtest/TicketService.js';
import TicketTypeRequest from './src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from './src/pairtest/lib/InvalidPurchaseException.js';

console.log('Running manual tests for TicketService...\n');

const ticketService = new TicketService();

// Test 1: Valid account ID
console.log('Test 1: Valid account ID');
try {
  ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
  console.log('✅ PASS: Valid account ID accepted');
} catch (error) {
  console.log('❌ FAIL: Valid account ID rejected:', error.message);
}

// Test 2: Invalid account ID (string)
console.log('\nTest 2: Invalid account ID (string)');
try {
  ticketService.purchaseTickets('1', new TicketTypeRequest('ADULT', 1));
  console.log('❌ FAIL: String account ID should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: String account ID correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 3: Invalid account ID (negative)
console.log('\nTest 3: Invalid account ID (negative)');
try {
  ticketService.purchaseTickets(-1, new TicketTypeRequest('ADULT', 1));
  console.log('❌ FAIL: Negative account ID should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: Negative account ID correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 4: No ticket requests
console.log('\nTest 4: No ticket requests');
try {
  ticketService.purchaseTickets(1);
  console.log('❌ FAIL: No ticket requests should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: No ticket requests correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 5: More than 25 tickets
console.log('\nTest 5: More than 25 tickets');
try {
  ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 26));
  console.log('❌ FAIL: More than 25 tickets should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: More than 25 tickets correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 6: Child tickets without adult
console.log('\nTest 6: Child tickets without adult');
try {
  ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 1));
  console.log('❌ FAIL: Child tickets without adult should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: Child tickets without adult correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 7: Infant tickets without adult
console.log('\nTest 7: Infant tickets without adult');
try {
  ticketService.purchaseTickets(1, new TicketTypeRequest('INFANT', 1));
  console.log('❌ FAIL: Infant tickets without adult should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: Infant tickets without adult correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 8: Valid mixed tickets
console.log('\nTest 8: Valid mixed tickets');
try {
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 2),
    new TicketTypeRequest('CHILD', 1),
    new TicketTypeRequest('INFANT', 1)
  );
  console.log('✅ PASS: Valid mixed tickets accepted');
} catch (error) {
  console.log('❌ FAIL: Valid mixed tickets rejected:', error.message);
}

// Test 9: Exactly 25 tickets
console.log('\nTest 9: Exactly 25 tickets');
try {
  ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 25));
  console.log('✅ PASS: Exactly 25 tickets accepted');
} catch (error) {
  console.log('❌ FAIL: Exactly 25 tickets rejected:', error.message);
}

// Test 10: More infants than adults (should fail)
console.log('\nTest 10: More infants than adults');
try {
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 1),
    new TicketTypeRequest('INFANT', 2)
  );
  console.log('❌ FAIL: More infants than adults should be rejected');
} catch (error) {
  if (error instanceof InvalidPurchaseException) {
    console.log('✅ PASS: More infants than adults correctly rejected');
  } else {
    console.log('❌ FAIL: Wrong error type:', error.message);
  }
}

// Test 11: Equal infants and adults (should pass)
console.log('\nTest 11: Equal infants and adults');
try {
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 2),
    new TicketTypeRequest('INFANT', 2)
  );
  console.log('✅ PASS: Equal infants and adults accepted');
} catch (error) {
  console.log('❌ FAIL: Equal infants and adults rejected:', error.message);
}

console.log('\nManual tests completed!');
