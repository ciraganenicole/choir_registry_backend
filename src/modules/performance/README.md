# Performance Module

The Performance module manages choir performances with a simplified architecture that focuses on the core performance details. Detailed song management, musicians, and voice parts are handled through the Rehearsal module, which can be promoted to populate the performance with detailed information.

## 🎵 Features

- **Performance Management**: Create, update, and delete performances
- **Simplified Structure**: Focus on core performance details (date, location, type, status)
- **Status Tracking**: Track performance lifecycle (upcoming → in_preparation → ready → completed)
- **Performance Types**: Support for various performance types (Concert, Worship Service, etc.)
- **Statistics**: Basic performance analytics
- **Filtering & Search**: Filter by type, status, date, and shift lead

## 🔄 New Hybrid Workflow

The performance module now works in conjunction with the rehearsal module:

1. **Create Performance** (status: `upcoming`) - Basic details only
2. **Add Rehearsals** (status: `in_preparation`) - Detailed planning happens here
3. **Promote Rehearsal** (status: `ready`) - Detailed data merged from rehearsal
4. **Mark Complete** (status: `completed`) - Performance archived

## 📊 Database Schema

### Performance Entity
```typescript
{
  id: number;
  date: Date;                    // Performance date and time
  location?: string;             // Optional location
  expectedAudience?: number;     // Expected audience size
  type: PerformanceType;         // Type of performance
  shiftLeadId: number;           // Overall shift lead (required)
  notes?: string;                // Additional notes
  status: PerformanceStatus;     // Performance status
  created_at: Date;
  updated_at: Date;
}
```

## 🎯 Performance Types

- **Concert**: Public concerts and performances
- **Worship Service**: Regular church services
- **Special Event**: Special occasions and events
- **Recording Session**: Studio recording sessions
- **Rehearsal Performance**: Practice performances
- **Other**: Miscellaneous events

## 📈 Performance Status

- **upcoming**: Performance is scheduled but not yet in preparation
- **in_preparation**: Rehearsals are being conducted for this performance
- **ready**: A rehearsal has been promoted and performance is ready
- **completed**: Performance has been completed and archived

## 🚀 API Endpoints

### Create Performance
```http
POST /performances
{
  "date": "2024-01-15T19:00:00Z",
  "location": "Main Sanctuary",
  "expectedAudience": 200,
  "type": "Worship Service",
  "shiftLeadId": 123,
  "notes": "Sunday evening service"
}
```

### Update Performance
```http
PATCH /performances/:id
{
  "status": "ready",
  "notes": "Updated notes"
}
```

### Get Performance Statistics
```http
GET /performances/stats
```

### Filter Performances
```http
GET /performances?type=Worship Service&status=upcoming&startDate=2024-01-01&endDate=2024-12-31
```

## 🔗 Integration with Rehearsal Module

- **Performance Creation**: Create performance with basic details
- **Rehearsal Planning**: Use rehearsal module for detailed song planning
- **Data Promotion**: Promote rehearsal to populate performance with detailed data
- **Status Management**: Update performance status as workflow progresses

## 📊 Statistics

The module provides:
- Total performances count
- Completed performances count
- Upcoming performances count
- Breakdown by performance type
- Breakdown by performance status
- Monthly performance trends

## 🔐 Permissions

- **SUPER_ADMIN**: Full access to all operations
- **LEAD users**: Can create/update/delete performances when on active shift

## 🎭 Usage Examples

### Creating a New Performance
```typescript
const performance = await performanceService.create({
  date: '2024-01-15T19:00:00Z',
  location: 'Main Sanctuary',
  type: PerformanceType.WORSHIP_SERVICE,
  shiftLeadId: 123,
  notes: 'Sunday evening service'
}, userId, userType, userRole);
```

### Updating Performance Status
```typescript
const updatedPerformance = await performanceService.update(id, {
  status: PerformanceStatus.READY
}, userId, userType, userRole);
```

### Getting Performance Statistics
```typescript
const stats = await performanceService.getStats();
// Returns: { totalPerformances, completedPerformances, upcomingPerformances, byType, byStatus, byMonth }
```

## 🔄 Migration from Old System

The old performance system with embedded songs and musicians has been replaced with:
- **Simplified Performance Entity**: Core performance details only
- **Rehearsal Module**: Handles detailed song planning and participant management
- **Hybrid Workflow**: Performance + Rehearsal integration for complete functionality

This new architecture provides better separation of concerns and more flexible performance planning workflows. 