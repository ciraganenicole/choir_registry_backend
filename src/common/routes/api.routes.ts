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
    }
}; 