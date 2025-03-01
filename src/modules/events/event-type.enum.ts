export enum EventType {
    NORMAL = 'NORMAL',          // Regular daily attendance
    WORSHIPPER = 'WORSHIPPER',         // Worshipper practice/performance
    COMMITTEE = 'COMMITTEE', // Administrative meetings
    MUSIC = 'MUSIC',
    SUNDAY_SERVICE = 'SUNDAY_SERVICE',
    SPECIAL = 'SPECIAL'        // Other special events
} 

export const EventSchedule: Record<EventType, { days: number[], time: string } | null> = {
    [EventType.NORMAL]: { days: [3, 6], time: '13:30' }, // Wednesday (3) and Sunday (0)
    [EventType.WORSHIPPER]: { days: [4], time: '14:00' },    // Thursday (4)
    [EventType.SUNDAY_SERVICE]: { days: [0], time: '09:00' }, // Sunday (0)
    [EventType.COMMITTEE]: null, // Random
    [EventType.MUSIC]: null,          // Random
    [EventType.SPECIAL]: null         // Random
};
