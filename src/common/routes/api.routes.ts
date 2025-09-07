export const API_ROUTES = {
    USERS: {
        BASE: 'users',
        BY_ID: 'users/:id',
        BY_CATEGORY: 'users/category/:category',
        FINGERPRINT: 'users/:id/fingerprint',
        UPLOAD_PICTURE: '/users/:id/upload-picture',
        TRANSACTIONS: '/users/:id/transactions',
    },
    ATTENDANCE: {
        BASE: 'attendance',
        BY_ID: 'attendance/:id',
        BY_USER: 'attendance/user/:userId',
        MARK: 'attendance/mark',
        JUSTIFY: 'attendance/:id/justify'
    },
    AUTH: {
        LOGIN: 'auth/login',
        REGISTER: 'auth/register',
        PROFILE: 'auth/profile',
        REFRESH: 'auth/refresh'
    },
    WEBAUTHN: {
        REGISTER: 'webauthn/register',
        AUTHENTICATE: 'webauthn/authenticate',
        VERIFY: 'webauthn/verify',
    },
    SONGS: {
        BASE: 'songs',
        BY_ID: 'songs/:id',
        STATS: 'songs/stats',
        BY_USER: 'songs/by-user/:userId',
        MY_SONGS: 'songs/my-songs',
        ALL: 'songs/all',
        PERFORM: 'songs/:id/perform',
        BULK_STATUS: 'songs/bulk/status',
        PERMISSIONS: 'songs/permissions',
    },
    LEADERSHIP_SHIFTS: {
        BASE: 'leadership-shifts',
        BY_ID: 'leadership-shifts/:id',
        STATS: 'leadership-shifts/stats',
        HISTORY: 'leadership-shifts/history',
        CURRENT: 'leadership-shifts/current',
        UPCOMING: 'leadership-shifts/upcoming',
        BY_LEADER: 'leadership-shifts/leader/:leaderId',
        BY_STATUS: 'leadership-shifts/status/:status',
    }
}; 