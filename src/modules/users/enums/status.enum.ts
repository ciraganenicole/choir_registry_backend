export enum StatusReason {
    BIRTH = 'BIRTH',
    ILLNESS = 'ILLNESS',
    TRAVEL = 'TRAVEL',
    EDUCATION = 'EDUCATION',
    WORK = 'WORK',
    FAMILY = 'FAMILY',
    OTHER = 'OTHER',
    INSUBORDINATION = 'INSUBORDINATION',
    RULE_VIOLATION = 'RULE_VIOLATION',
    ATTENDANCE_ISSUES = 'ATTENDANCE_ISSUES',
    BEHAVIOR_ISSUES = 'BEHAVIOR_ISSUES',
    SEVERE_MISCONDUCT = 'SEVERE_MISCONDUCT',
    REPEATED_VIOLATIONS = 'REPEATED_VIOLATIONS',
    VOLUNTARY_EXIT = 'VOLUNTARY_EXIT'
} 

export enum UserStatus {
    ON_LEAVE = 'ON_LEAVE',
    SUSPENDED = 'SUSPENDED',
    EXPELLED = 'EXPELLED'
}

export const UserStatusReasons: Record<UserStatus, StatusReason[]> = {
    [UserStatus.ON_LEAVE]: [
        StatusReason.BIRTH,
        StatusReason.ILLNESS,
        StatusReason.TRAVEL,
        StatusReason.EDUCATION,
        StatusReason.WORK,
        StatusReason.FAMILY,
        StatusReason.OTHER
    ],
    [UserStatus.SUSPENDED]: [
        StatusReason.INSUBORDINATION,
        StatusReason.RULE_VIOLATION,
        StatusReason.ATTENDANCE_ISSUES,
        StatusReason.BEHAVIOR_ISSUES,
        StatusReason.OTHER
    ],
    [UserStatus.EXPELLED]: [
        StatusReason.SEVERE_MISCONDUCT,
        StatusReason.REPEATED_VIOLATIONS,
        StatusReason.VOLUNTARY_EXIT,
        StatusReason.OTHER
    ]
};

// Helper functions to work with the combined status enum
export const UserStatusHelper = {
    isOnLeave: (status: UserStatus): boolean => status === UserStatus.ON_LEAVE,
    isSuspended: (status: UserStatus): boolean => status === UserStatus.SUSPENDED,
    isExpelled: (status: UserStatus): boolean => status === UserStatus.EXPELLED,
    
    getBaseStatus: (status: UserStatus): string => {
        return status;
    },

    getReason: (status: UserStatus): string => {
        return UserStatusReasons[status][0];
    },

    isValidTransition: (from: UserStatus, to: UserStatus): boolean => {
        const fromBase = UserStatusHelper.getBaseStatus(from);
        const toBase = UserStatusHelper.getBaseStatus(to);

        const validTransitions: Record<UserStatus, UserStatus[]> = {
            [UserStatus.ON_LEAVE]: [UserStatus.SUSPENDED, UserStatus.EXPELLED],
            [UserStatus.SUSPENDED]: [UserStatus.EXPELLED],
            [UserStatus.EXPELLED]: []
        };

        return validTransitions[fromBase as UserStatus]?.includes(toBase as UserStatus) || false;
    }
}; 