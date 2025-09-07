# Leadership Shift Management Module

## Overview

The Leadership Shift Management module allows SUPER_ADMIN users to manage choir leadership periods and conductor assignments. This module tracks who leads the choir during different time periods, manages transitions between leaders, and provides statistics on leadership performance.

## Features

### Core Functionality
- **Create Leadership Shifts**: Assign leaders to specific time periods
- **Manage Shift Status**: Track shifts as Active, Upcoming, Completed, or Cancelled
- **Conflict Prevention**: Prevent overlapping shifts for the same leader
- **Event Tracking**: Track scheduled and completed events for each shift
- **Statistics**: Comprehensive reporting on leadership performance

### Key Features
- **Single Active Shift**: Only one shift can be active at a time
- **Leader Validation**: Only users with LEAD category can be assigned as leaders
- **Date Range Management**: Flexible start and end date assignments
- **Performance Metrics**: Track events scheduled and completed per shift
- **Historical Data**: Maintain complete history of all leadership periods

## Database Schema

### LeadershipShift Entity

```typescript
@Entity('leadership_shifts')
export class LeadershipShift {
  id: number;                    // Primary key
  name: string;                  // Shift name (e.g., "Winter 2024")
  startDate: Date;               // Shift start date
  endDate: Date;                 // Shift end date
  leaderId: number;              // Foreign key to User
  status: ShiftStatus;           // Active, Upcoming, Completed, Cancelled
  description?: string;          // Optional description
  notes?: string;                // Optional notes
  eventsScheduled: number;       // Count of scheduled events
  eventsCompleted: number;       // Count of completed events
  created_at: Date;              // Creation timestamp
  updated_at: Date;              // Last update timestamp
  createdById?: number;          // Who created this shift
}
```

### ShiftStatus Enum

```typescript
export enum ShiftStatus {
  ACTIVE = 'Active',           // Currently active shift
  UPCOMING = 'Upcoming',       // Future shift
  COMPLETED = 'Completed',     // Past shift
  CANCELLED = 'Cancelled',     // Cancelled shift
}
```

## API Endpoints

### Base URL: `/leadership-shifts`

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| POST | `/` | Create new leadership shift | SUPER_ADMIN, LEAD |
| GET | `/` | Get all shifts with filtering | SUPER_ADMIN, LEAD |
| GET | `/stats` | Get shift statistics | SUPER_ADMIN, LEAD |
| GET | `/history` | Get leader performance history | SUPER_ADMIN, LEAD |
| GET | `/current` | Get current active shift | SUPER_ADMIN, LEAD |
| GET | `/current-active` | Get current active shift (auto-determined) | SUPER_ADMIN, LEAD |
| GET | `/upcoming` | Get upcoming shifts | SUPER_ADMIN, LEAD |
| GET | `/next-upcoming` | Get next upcoming shift | SUPER_ADMIN, LEAD |
| GET | `/leader/:leaderId` | Get shifts by specific leader | SUPER_ADMIN, LEAD |
| GET | `/:id` | Get specific shift by ID | SUPER_ADMIN, LEAD |
| PATCH | `/:id` | Update shift | SUPER_ADMIN, LEAD |
| DELETE | `/:id` | Delete shift | SUPER_ADMIN, LEAD |
| GET | `/status/:status` | Get shifts by status | SUPER_ADMIN, LEAD |
| POST | `/update-statuses` | Update shift statuses based on current date | SUPER_ADMIN, LEAD |

## Authorization Rules

### Access Control
- **SUPER_ADMIN or LEAD**: All endpoints require either SUPER_ADMIN role or LEAD category
- **Leader Validation**: Only users with LEAD category can be assigned as leaders
- **Conflict Prevention**: System prevents overlapping shifts for the same leader

### Business Rules
1. **Single Active Shift**: Only one shift can be active at a time
2. **Date Validation**: Start date must be before end date
3. **Leader Requirements**: Assigned leader must have LEAD category
4. **Status Management**: Changing a shift to ACTIVE deactivates other active shifts

## Usage Examples

### Creating a Leadership Shift

```typescript
// Create a new leadership shift
const newShift = await leadershipShiftService.create({
  name: "Winter 2024",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-03-31T23:59:59Z",
  leaderId: 123, // User with LEAD category
  status: ShiftStatus.UPCOMING,
  description: "Winter season leadership period",
  notes: "Focus on holiday repertoire"
}, adminUserId);
```

### Getting Statistics

```typescript
// Get comprehensive statistics
const stats = await leadershipShiftService.getStats();
// Returns:
// {
//   totalShifts: 4,
//   activeShifts: 1,
//   upcomingShifts: 2,
//   completedShifts: 1,
//   currentLeader: { id: 123, name: "Sarah Johnson", email: "sarah@example.com" },
//   nextTransitionDays: 68,
//   activeLeaders: 5,
//   byStatus: { Active: 1, Upcoming: 2, Completed: 1, Cancelled: 0 },
//   byMonth: { January: 1, February: 1, March: 1, April: 1 }
// }
```

### Getting Leader History

```typescript
// Get leader performance history
const history = await leadershipShiftService.getLeaderHistory();
// Returns:
// [
//   {
//     leaderId: 123,
//     leaderName: "Sarah Johnson",
//     leaderEmail: "sarah@example.com",
//     periodsLed: 3,
//     totalEvents: 24,
//     totalEventsCompleted: 22
//   },
//   // ... more leaders
// ]
```

## Integration with Other Modules

### Performance Module Integration
The Leadership Shift module can integrate with the Performance module to:
- Automatically update event counts when performances are created
- Link performances to current shift leaders
- Track performance metrics per leadership period

### User Module Integration
- Validates that assigned leaders have LEAD category
- References user data for leader information
- Maintains audit trail of who created shifts

## Frontend Integration

### Dashboard Components
1. **Summary Cards**: Display current leader, total shifts, active leaders, next transition
2. **Leadership Shifts**: List current and upcoming shifts with details
3. **Leadership History**: Table showing leader performance metrics
4. **Shift Management**: Forms for creating and editing shifts

### Key Data Points for Frontend
- Current active leader information
- Days until next transition
- Upcoming shifts list
- Leader performance statistics
- Shift status indicators

### Frontend Validation
The frontend handles all validation logic client-side using the following approaches:

#### Available Endpoints for Validation
- `GET /leadership-shifts/current-active` - Get current active shift
- `GET /leadership-shifts/stats` - Get shift statistics including active count
- `GET /leadership-shifts/status/ACTIVE` - Get all active shifts

#### Validation Patterns
```javascript
// Check for single active shift
const activeShifts = shifts.filter(shift => shift.status === 'ACTIVE');
const isValid = activeShifts.length <= 1;

// Get current active shift
const currentShift = await fetch('/leadership-shifts/current-active');
const hasActiveShift = currentShift !== null;
```

#### Benefits of Frontend Validation
- **Real-time feedback** - Immediate validation without API calls
- **Reduced server load** - No validation endpoints needed
- **Better UX** - Instant validation responses
- **Simplified backend** - Focus on core business logic

## Error Handling

### Common Error Scenarios
1. **Leader Not Found**: 404 when trying to assign non-existent user
2. **Invalid Leader**: 400 when user doesn't have LEAD category
3. **Date Conflicts**: 409 when leader has overlapping shifts
4. **Invalid Dates**: 400 when start date is after end date
5. **Unauthorized Access**: 403 for non-SUPER_ADMIN users

### Error Response Format
```typescript
{
  statusCode: 400,
  message: "User John Doe does not have LEAD category",
  error: "Bad Request"
}
```

## Development Notes

### Migration
Run the migration to create the leadership_shifts table:
```bash
npm run migration:run
```

### Testing
Test scenarios should include:
- Creating shifts with valid leaders
- Preventing overlapping shifts
- Status transitions (Upcoming → Active → Completed)
- Error handling for invalid inputs
- Authorization checks

### Future Enhancements
1. **Automatic Transitions**: Auto-activate upcoming shifts when current shift ends
2. **Performance Integration**: Link performances to shifts automatically
3. **Notification System**: Alert leaders about upcoming transitions
4. **Reporting**: Advanced analytics and reporting features
5. **Bulk Operations**: Create multiple shifts at once
6. **Templates**: Predefined shift templates for common periods

## Configuration

### Environment Variables
No specific environment variables required for this module.

### Dependencies
- TypeORM for database operations
- NestJS validation for DTOs
- JWT authentication for authorization
- User module for leader validation

## API Documentation

The module includes comprehensive Swagger documentation with:
- Request/response schemas
- Authentication requirements
- Error codes and messages
- Example requests and responses

Access the API documentation at `/api` when the application is running. 