# Song Management Authorization Guide

This document explains how song authorization works in the choir system for frontend integration.

## 🔐 User Types & Authorization

### 1. **Admin Users** (`admin_users` table)
- **ID Type**: UUID (string)
- **Role**: `SUPER_ADMIN`, `ATTENDANCE_ADMIN`, `FINANCE_ADMIN`
- **Full Permissions**: Can manage all songs
- **Can Create**: ✅ Yes (but uses `addedById: 0` for tracking)
- **Can Update**: ✅ Yes (any song)
- **Can Delete**: ✅ Yes (any song)
- **Can View**: ✅ Yes (all songs)
- **Can Manage Others**: ✅ Yes

### 2. **Regular Users with LEAD Category** (`users` table)
- **ID Type**: Integer
- **Role**: `USER` (with `categories` including `LEAD`)
- **Limited Permissions**: Can only manage their own songs
- **Can Create**: ✅ Yes
- **Can Update**: ✅ Yes (only their songs)
- **Can Delete**: ✅ Yes (only their songs)
- **Can View**: ✅ Yes (all songs)
- **Can Manage Others**: ❌ No

### 3. **Regular Users** (`users` table)
- **ID Type**: Integer
- **Role**: `USER` (with `categories` like `NORMAL`, `WORSHIPPER`, etc.)
- **Read-Only**: Can only view songs
- **Can Create**: ❌ No
- **Can Update**: ❌ No
- **Can Delete**: ❌ No
- **Can View**: ✅ Yes (all songs)
- **Can Manage Others**: ❌ No

## 🎯 Authorization Logic

### JWT Token Structure
```typescript
// For regular users (including LEAD)
{
  sub: 123, // user ID
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  categories: ["NORMAL", "LEAD"], // User categories
  role: "LEAD", // Derived from categories (LEAD if has LEAD category, otherwise USER)
  type: "user"
}

// For admin users
{
  sub: "uuid-here",
  email: "admin@example.com",
  role: "SUPER_ADMIN",
  type: "admin"
}
```

### Permission Checking
The backend uses a **dual authorization system**:

1. **Route-level protection**: `@Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)`
2. **Business logic validation**: Checks ownership and permissions in service layer

```typescript
// Backend permission check example
const user = await getUserInfo(userId);
const permissions = getSongPermissions(user);

if (!permissions.canUpdate) {
  throw new ForbiddenException('No update permission');
}

if (!permissions.canManageOthers) {
  // Check ownership for non-admin users
  const canManage = await canManageSong(songId, user);
  if (!canManage) {
    throw new ForbiddenException('Can only manage own songs');
  }
}
```

## 📋 API Endpoints & Authorization

### Protected Endpoints (Requires Auth + LEAD Category or Admin Role)

| Endpoint | Method | Required Role | Description |
|----------|--------|---------------|-------------|
| `/songs` | POST | `SUPER_ADMIN` or `LEAD` | Create new song |
| `/songs/:id` | PATCH | `SUPER_ADMIN` or `LEAD` | Update song (owner or admin) |
| `/songs/:id` | DELETE | `SUPER_ADMIN` or `LEAD` | Delete song (owner or admin) |
| `/songs/my-songs` | GET | `SUPER_ADMIN` or `LEAD` | View own songs |
| `/songs/by-user/:userId` | GET | `SUPER_ADMIN` or `LEAD` | View songs by user |
| `/songs/:id/perform` | POST | `SUPER_ADMIN` or `LEAD` | Mark song as performed |
| `/songs/bulk/status` | PATCH | `SUPER_ADMIN` or `LEAD` | Bulk update status |
| `/songs/permissions` | GET | `SUPER_ADMIN` or `LEAD` | Get user permissions |

### Public Endpoints (No Auth Required)
- `GET /songs` - View all songs with pagination
- `GET /songs/all` - View all songs without pagination  
- `GET /songs/:id` - View specific song
- `GET /songs/stats/overview` - View song statistics

## 🚀 Frontend Integration Guide

### 1. **Authentication Flow**
```typescript
// Login and get JWT token
const loginResponse = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

const { access_token, user } = loginResponse.data;

// Store token and user info
localStorage.setItem('token', access_token);
localStorage.setItem('user', JSON.stringify(user));
```

### 2. **Authorization Checks**
```typescript
// Check if user can manage songs
const canManageSongs = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user.role === 'SUPER_ADMIN' || user.categories?.includes('LEAD');
};

// Check if user can edit specific song
const canEditSong = (song) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Admin can edit any song
  if (user.role === 'SUPER_ADMIN') return true;
  
  // LEAD users can only edit their own songs
  if (user.categories?.includes('LEAD')) {
    return song.addedById === user.id;
  }
  
  return false;
};
```

### 3. **API Calls with Authorization**
```typescript
// Set up axios with auth header
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Create song (LEAD or admin only)
const createSong = async (songData) => {
  try {
    const response = await api.post('/songs', songData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      // Handle permission denied
      showError('You do not have permission to create songs');
    }
    throw error;
  }
};

// Update song (owner or admin only)
const updateSong = async (songId, updateData) => {
  try {
    const response = await api.patch(`/songs/${songId}`, updateData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      showError('You can only edit your own songs');
    }
    throw error;
  }
};
```

### 4. **UI Permission Handling**
```typescript
// React component example
const SongList = () => {
  const [songs, setSongs] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  
  const canCreate = user.role === 'SUPER_ADMIN' || user.categories?.includes('LEAD');
  
  return (
    <div>
      {canCreate && (
        <button onClick={showCreateForm}>Add New Song</button>
      )}
      
      {songs.map(song => (
        <SongCard 
          key={song.id} 
          song={song}
          canEdit={canEditSong(song)}
          onEdit={() => handleEdit(song)}
        />
      ))}
    </div>
  );
};
```

## 🔒 Error Handling

### Common HTTP Status Codes
- **200/201**: Success
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **400**: Bad request (validation errors)

### Error Response Format
```typescript
{
  "statusCode": 403,
  "message": "You do not have permission to create songs. Only users with LEAD category or admin privileges can create songs.",
  "error": "Forbidden"
}
```

## 📝 Best Practices

### Frontend
1. **Always check permissions before showing UI elements**
2. **Handle 403 errors gracefully with user-friendly messages**
3. **Cache user permissions to avoid repeated API calls**
4. **Use role-based routing to prevent unauthorized access**
5. **Validate permissions on both client and server side**

### Backend
1. **Always validate permissions in service layer**
2. **Check song ownership for non-admin users**
3. **Use proper HTTP status codes**
4. **Provide clear error messages**
5. **Log authorization failures for security monitoring**

## 🎵 User Categories

The system uses these user categories:
- **NORMAL**: Regular choir members (read-only)
- **WORSHIPPER**: Worship team members (read-only)
- **COMMITTEE**: Committee members (read-only)
- **NEWCOMER**: New choir members (read-only)
- **LEAD**: Song leaders (can create/manage songs)

### Assigning LEAD Category
Only `SUPER_ADMIN` can assign LEAD category:
```typescript
// Assign LEAD role to user
await api.post(`/users/${userId}/assign-lead`);

// Remove LEAD role from user  
await api.delete(`/users/${userId}/remove-lead`);
```

## 🔧 Testing Authorization

### Test Scenarios
1. **Regular user** tries to create song → 403 Forbidden
2. **LEAD user** creates song → 201 Created
3. **LEAD user** edits own song → 200 OK
4. **LEAD user** edits other's song → 403 Forbidden
5. **Admin** edits any song → 200 OK
6. **Invalid token** → 401 Unauthorized

This authorization system ensures secure and controlled access to song management features while maintaining flexibility for different user roles. 