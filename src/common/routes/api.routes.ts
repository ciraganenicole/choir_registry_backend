export const API_ROUTES = {
    USERS: {
        BASE: 'users',
        BY_ID: 'users/:id',
        BY_CATEGORY: 'users/category/:category',
        FINGERPRINT: 'users/:id/fingerprint',
    },
    ATTENDANCE: {
        BASE: 'attendance',
        BY_ID: 'attendance/:id',
        BY_USER: 'attendance/user/:userId',
        MARK: 'attendance/mark',
        JUSTIFY: 'attendance/:id/justify'
    },
    LEAVE: {
        BASE: 'leave',
        BY_ID: 'leave/:id',
        BY_USER: 'leave/user/:userId',
        APPROVE: 'leave/:id/approve',
        REJECT: 'leave/:id/reject',
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
    }
}; 