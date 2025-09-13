# Cinema Tickets JavaScript

A ticket purchasing service for cinema bookings with payment and seat reservation third-party service integration.


## Installation

```bash
# Install dependencies
npm install
```

## Usage

### Basic Example

```javascript
import TicketService from './src/pairtest/TicketService.js';
import TicketTypeRequest from './src/pairtest/lib/TicketTypeRequest.js';

const ticketService = new TicketService();

// Purchase 2 adult tickets and 1 child ticket
try {
  ticketService.purchaseTickets(
    12345, // Account ID
    new TicketTypeRequest('ADULT', 2),
    new TicketTypeRequest('CHILD', 1)
  );
  console.log('Tickets purchased successfully!');
} catch (error) {
  console.error('Purchase failed:', error.message);
}
```

### Creating Ticket Requests

```javascript
// Valid ticket types: 'ADULT', 'CHILD', 'INFANT'
const adultTickets = new TicketTypeRequest('ADULT', 2);
const childTickets = new TicketTypeRequest('CHILD', 1);
const infantTickets = new TicketTypeRequest('INFANT', 1);
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm test -- --testPathIgnorePatterns=integration
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Configuration

The service uses a centralized configuration system in `src/pairtest/config.js`:

```javascript
export const TICKET_TYPES = {
  INFANT: 'INFANT',
  CHILD: 'CHILD',
  ADULT: 'ADULT'
};

export const defaultConfig = {
  pricesPence: {
    [TICKET_TYPES.INFANT]: 0,     // £0.00
    [TICKET_TYPES.CHILD]: 1500,   // £15.00
    [TICKET_TYPES.ADULT]: 2500    // £25.00
  },
  maxTickets: 25
};
```

## Development

### Node.js Version
- Requires Node.js >= 20.9.0 (as specified in package.json)
- Uses ES modules (`"type": "module"`)

### Testing
- **Unit Tests**: Test individual methods and business logic
- **Integration Tests**: Test end-to-end workflows with third-party services

## CI/CD

The project includes GitHub Actions workflow (`.github/workflows/main.yml`) that:
- Runs on multiple Node.js versions (18.x, 20.x)
- Executes unit and integration tests
- Generates test coverage reports
