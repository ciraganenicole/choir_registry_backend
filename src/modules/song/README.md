# Song Management Module

A comprehensive song management system for choir repertoire with lead-based permissions and advanced features.

## 🎯 Features

- **Lead-based Management**: Only users with LEAD role can add/edit songs
- **Pagination**: Efficient pagination for large song collections
- **Advanced Filtering**: Filter by genre, difficulty, status, and search
- **Performance Tracking**: Track how many times songs are performed
- **Bulk Operations**: Update multiple songs at once
- **Comprehensive Stats**: Detailed statistics with breakdowns
- **Input Validation**: Robust validation with detailed error messages
- **Optimized Queries**: Database-optimized queries with proper indexing

## 📋 API Endpoints

### Public Endpoints (No Authentication Required)

#### `GET /songs`
Get paginated list of songs with filtering and sorting.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page
- `genre` (string): Filter by genre
- `difficulty` (enum): Filter by difficulty (Easy, Intermediate, Advanced)
- `status` (enum): Filter by status (Active, In Rehearsal, Archived)
- `search` (string): Search in title, composer, genre, or lyrics
- `sortBy` (string): Sort by field (title, composer, genre, created_at, difficulty)
- `sortOrder` (string): Sort order (ASC, DESC)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Song Title",
      "composer": "Composer Name",
      "genre": "Classical",
      "difficulty": "Intermediate",
      "status": "Active",

      "lyrics": "Song lyrics...",
      "performed": 5,
      "lastPerformance": "2024-01-15T10:30:00Z",
      "added_by": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "LEAD",
        "matricule": "NJC-1-2024"
      },
      "addedById": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `GET /songs/all`
Get all songs without pagination (for dropdowns, etc.).

#### `GET /songs/:id`
Get a specific song by ID.

#### `GET /songs/stats`
Get comprehensive song statistics.

**Response:**
```json
{
  "totalSongs": 150,
  "activeRepertoire": 45,
  "inRehearsal": 12,
  "newAdditions": 8,
  "byDifficulty": {
    "Easy": 30,
    "Intermediate": 80,
    "Advanced": 40
  },
  "byGenre": {
    "Classical": 50,
    "Gospel": 30,
    "Contemporary": 25,
    "Traditional": 20,
    "Jazz": 15,
    "Pop": 10
  }
}
```

### Protected Endpoints (Requires LEAD Role)

#### `POST /songs`
Create a new song.

**Request Body:**
```json
{
  "title": "Song Title",
  "composer": "Composer Name",
  "genre": "Classical",
  "difficulty": "Intermediate",
  "status": "Active",

  "lyrics": "Song lyrics...",
  "times_performed": 0,
  "last_performed": "2024-01-15"
}
```

#### `PATCH /songs/:id`
Update a song (only by the lead who added it).

#### `DELETE /songs/:id`
Delete a song (only by the lead who added it).

#### `GET /songs/my-songs`
Get songs added by the current user.

#### `GET /songs/by-lead/:userId`
Get songs added by a specific lead.

#### `POST /songs/:id/perform`
Increment the performance count for a song.

#### `PATCH /songs/bulk/status`
Update status for multiple songs.

**Request Body:**
```json
{
  "songIds": [1, 2, 3],
  "status": "Active"
}
```

## 🔐 Authentication & Authorization

- **Public Endpoints**: No authentication required
- **Protected Endpoints**: Require JWT token + LEAD role
- **Ownership**: Users can only modify songs they added
- **Role-based Access**: Only users with `UserRole.LEAD` can manage songs

## 🗄️ Database Schema

```sql
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    composer VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    difficulty song_difficulty_enum NOT NULL,
    status song_status_enum NOT NULL,
    lyrics TEXT NOT NULL,
    times_performed INTEGER NOT NULL DEFAULT 0,
    last_performed DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    addedById INTEGER NOT NULL REFERENCES users(id)
);
```

## 🚀 Performance Optimizations

- **Database Indexes**: Indexed on frequently queried fields
- **Efficient Stats**: Raw SQL queries for statistics
- **Pagination**: Prevents loading large datasets
- **Query Optimization**: Optimized search and filtering
- **Lazy Loading**: Relations loaded only when needed

## 🛡️ Error Handling

- **Validation Errors**: Detailed validation messages
- **Permission Errors**: Clear authorization messages
- **Duplicate Prevention**: Prevents duplicate songs
- **Not Found Errors**: Proper 404 responses
- **Bad Request Errors**: Clear error messages for invalid data

## 📝 Usage Examples

### Frontend Integration

```typescript
// Fetch paginated songs
const response = await api.get('/songs', {
  params: {
    page: 1,
    limit: 20,
    genre: 'Classical',
    search: 'Mozart'
  }
});

// Create a new song
const newSong = await api.post('/songs', {
  title: 'New Song',
  composer: 'Composer',
  genre: 'Classical',
  difficulty: 'Intermediate',
  status: 'Active',
  
  lyrics: 'Song lyrics...'
});

// Mark song as performed
await api.post(`/songs/${songId}/perform`);
```

## 🔧 Configuration

The module is self-contained and requires no additional configuration beyond:
- Database connection (configured in app.module.ts)
- JWT authentication (configured in auth module)
- User roles (configured in users module)

## 🧪 Testing

The module includes comprehensive error handling and validation, making it suitable for production use. All endpoints are properly typed and validated. 