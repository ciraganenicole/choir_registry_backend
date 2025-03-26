import { DataSource } from 'typeorm';
import { AttendanceEventType, AttendanceStatus, AttendanceType } from '../../modules/attendance/attendance.entity';
import { User } from '../../modules/users/user.entity';

export const seedAttendance = async (dataSource: DataSource): Promise<void> => {
    try {
        const userRepository = dataSource.getRepository(User);

        // Get all users
        const users = await userRepository.find();
        if (!users.length) {
            console.log('No users found for attendance seeding');
            return;
        }

        // Create attendance records for the past 30 days
        const today = new Date();
        let recordsCreated = 0;
        
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0); // Reset time part
            
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            // Create different types of events for different days
            const events = [
                {
                    name: 'Daily Practice',
                    type: AttendanceEventType.NORMAL,
                    startTime: '09:00:00',
                    endTime: '12:00:00'
                },
                {
                    name: 'Worship Session',
                    type: AttendanceEventType.WORSHIPPER,
                    startTime: '14:00:00',
                    endTime: '16:00:00'
                },
                {
                    name: 'Committee Meeting',
                    type: AttendanceEventType.COMMITTEE,
                    startTime: '16:30:00',
                    endTime: '18:00:00'
                }
            ];

            // Create attendance records for each user for each event
            for (const user of users) {
                for (const event of events) {
                    // Randomly determine attendance status
                    const random = Math.random();
                    let status = AttendanceStatus.PRESENT;
                    let justified = false;
                    let justification = null;

                    if (random < 0.1) {
                        status = AttendanceStatus.LATE;
                    } else if (random < 0.2) {
                        status = AttendanceStatus.ABSENT;
                        if (Math.random() < 0.5) {
                            justified = true;
                            justification = 'Personal reasons';
                        }
                    }

                    // Insert using raw SQL to avoid TypeORM's type conversion
                    await dataSource.query(`
                        INSERT INTO attendance (
                            "userId", "eventName", "eventType", "date", 
                            "startTime", "endTime", "status", "type", 
                            "justified", "justification", "createdAt", "updatedAt"
                        ) VALUES (
                            $1, $2, $3, $4, $5::time, $6::time, $7, $8, $9, $10, NOW(), NOW()
                        )
                    `, [
                        user.id,
                        event.name,
                        event.type,
                        date.toISOString().split('T')[0],
                        event.startTime,
                        event.endTime,
                        status,
                        AttendanceType.MANUAL,
                        justified,
                        justification
                    ]);

                    recordsCreated++;
                }
            }
        }
        
        console.log(`Created ${recordsCreated} attendance records`);
    } catch (error) {
        console.error('Error seeding attendance:', error);
        throw error;
    }
}; 