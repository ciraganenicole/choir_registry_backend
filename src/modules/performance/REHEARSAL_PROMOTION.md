# Rehearsal Promotion Feature

## Overview

The rehearsal promotion feature allows a rehearsal to be promoted to populate a performance with detailed data when it's ready. This implements the "Hybrid Workflow" where performances start simple and get detailed data from rehearsals.

## 🔄 Workflow

### 1. Create Performance (Status: `upcoming`)
```http
POST /performances
{
  "date": "2024-01-15T19:00:00Z",
  "location": "Main Sanctuary",
  "type": "Worship Service",
  "shiftLeadId": 123,
  "notes": "Sunday evening service"
}
```

### 2. Mark Performance as In Preparation
```http
POST /performances/:id/mark-in-preparation
```
- Changes status from `upcoming` → `in_preparation`
- Performance is now ready to accept rehearsals

### 3. Create Rehearsals
```http
POST /rehearsals
{
  "title": "Final Rehearsal",
  "date": "2024-01-14T18:00:00Z",
  "performanceId": 123,
  "type": "Performance Preparation",
  "rehearsalSongs": [...],
  "notes": "Final run-through"
}
```

### 4. Promote Rehearsal to Performance
```http
POST /performances/:id/promote-rehearsal/:rehearsalId
```
- Copies all detailed data from rehearsal to performance
- Changes performance status from `in_preparation` → `ready`
- Performance now contains all songs, musicians, voice parts, etc.

### 5. Mark Performance as Completed
```http
POST /performances/:id/mark-completed
```
- Changes status from `ready` → `completed`
- Performance is archived

## 📊 Data Flow

### What Gets Copied

#### **Performance Songs**
- Song ID and basic info
- Lead singer assignment
- Notes and focus points
- Musical key (gamme)
- Time allocation
- Order in performance
- Previous lead singer tracking

#### **Musicians**
- User ID or external musician name
- Instrument type
- Soloist/accompanist flags
- Solo timing and notes
- Practice requirements
- Performance order

#### **Voice Parts**
- Voice part type (Soprano, Alto, Tenor, Bass)
- Assigned members
- Focus points and notes
- Time allocation
- Performance order

## 🚀 API Endpoints

### Performance Status Management
- `POST /performances/:id/mark-in-preparation` - Mark as in preparation
- `POST /performances/:id/promote-rehearsal/:rehearsalId` - Promote rehearsal
- `POST /performances/:id/mark-completed` - Mark as completed

### Performance Details (After Promotion)
- `GET /performances/:id` - Get performance with all detailed data
- All songs, musicians, and voice parts are included in the response

## 🔐 Permissions

- **SUPER_ADMIN**: Full access to all operations
- **LEAD users**: Can promote rehearsals when on active shift
- **Status validation**: Each status change has specific requirements

## 📋 Status Requirements

### `upcoming` → `in_preparation`
- Performance must be in `upcoming` status
- User must have appropriate permissions

### `in_preparation` → `ready`
- Performance must be in `in_preparation` status
- Rehearsal must belong to the performance
- All rehearsal data is copied to performance

### `ready` → `completed`
- Performance must be in `ready` status
- Performance must have detailed data from rehearsal

## 💡 Usage Examples

### Complete Workflow Example

```typescript
// 1. Create performance
const performance = await performanceService.create({
  date: '2024-01-15T19:00:00Z',
  location: 'Main Sanctuary',
  type: PerformanceType.WORSHIP_SERVICE,
  shiftLeadId: 123
}, userId, userType, userRole);

// 2. Mark as in preparation
await performanceService.markInPreparation(performance.id, userId, userType, userRole);

// 3. Create rehearsal (via rehearsal service)
const rehearsal = await rehearsalService.create({
  title: 'Final Rehearsal',
  date: '2024-01-14T18:00:00Z',
  performanceId: performance.id,
  rehearsalSongs: [...]
}, userId, userType, userRole);

// 4. Promote rehearsal
await performanceService.promoteRehearsal(performance.id, rehearsal.id, userId, userType, userRole);

// 5. Mark as completed
await performanceService.markCompleted(performance.id, userId, userType, userRole);
```

## 🔧 Technical Implementation

### New Entities Created
- `PerformanceSong` - Links songs to performances with detailed metadata
- `PerformanceSongMusician` - Musician assignments for each song
- `PerformanceVoicePart` - Voice part assignments for each song

### Data Copying Logic
- Rehearsal data is copied to performance tables
- All relationships and metadata are preserved
- Performance status is automatically updated
- Existing performance data is cleared before copying (allows re-promotion)

### Error Handling
- Validates performance status before promotion
- Ensures rehearsal belongs to performance
- Checks user permissions for all operations
- Provides clear error messages for invalid state transitions

## 🎯 Benefits

1. **Separation of Concerns**: Performance planning vs. execution
2. **Iterative Planning**: Multiple rehearsals can refine the performance
3. **Data Preservation**: All rehearsal details are captured in the final performance
4. **Workflow Control**: Clear status progression prevents invalid operations
5. **Flexibility**: Can re-promote if rehearsal data changes

## 🔮 Future Enhancements

- **Partial Promotion**: Promote specific songs or sections
- **Rehearsal Comparison**: Compare multiple rehearsals before promotion
- **Automated Promotion**: Rules-based promotion triggers
- **Performance Templates**: Pre-configured performance structures
- **Audit Trail**: Track all promotion history and changes
