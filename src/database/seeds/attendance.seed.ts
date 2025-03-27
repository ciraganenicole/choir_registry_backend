import { DataSource } from 'typeorm';
import { AttendanceEventType, AttendanceStatus, AttendanceType, JustificationReason } from '../../modules/attendance/attendance.entity';
import { User } from '../../modules/users/user.entity';
import { Attendance } from '../../modules/attendance/attendance.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse';

interface AttendanceRecord {
    [key: string]: string; // For dynamic date columns
}

function getRandomTimeBetween(start: string, end: string): string {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const randomTime = new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime()));
    return randomTime.toTimeString().slice(0, 5);
}

function convertDate(dateStr: string | undefined): string | null {
    if (!dateStr) return null;
    
    try {
        // Check if the date is already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        // Convert from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = dateStr.split('/');
        if (!day || !month || !year) return null;

        // Validate date parts
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
        if (dayNum < 1 || dayNum > 31) return null;
        if (monthNum < 1 || monthNum > 12) return null;
        if (yearNum < 2000 || yearNum > 2100) return null;

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (error) {
        console.log(`Error converting date: ${dateStr}`);
        return null;
    }
}

export const seedAttendance = async (dataSource: DataSource): Promise<void> => {
    try {
        const userRepository = dataSource.getRepository(User);
        const attendanceRepository = dataSource.getRepository(Attendance);

        // Get all users
        const users = await userRepository.find();
        if (!users.length) {
            console.log('No users found for attendance seeding');
            return;
        }

        // Read the CSV file
        const csvFilePath = path.join(__dirname, '../../../uploads/registre.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        
        // Parse CSV content
        const records = await new Promise<AttendanceRecord[]>((resolve, reject) => {
            csv.parse(fileContent, {
                columns: true,
                skip_empty_lines: true
            }, (err, records) => {
                if (err) reject(err);
                else resolve(records as AttendanceRecord[]);
            });
        });

        let recordsCreated = 0;
        
        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const user = users[i]; // Use the same index to get the corresponding user

            if (!user) {
                console.log(`No user found at index ${i}`);
                continue;
            }

            // Get all attendance symbols from the record
            const attendanceSymbols = Object.entries(record)
                .map(([date, symbol]) => {
                    const convertedDate = convertDate(date);
                    if (!convertedDate) {
                        console.log(`Skipping invalid date: ${date}`);
                        return null;
                    }
                    return { date: convertedDate, symbol: symbol as string };
                })
                .filter((item): item is { date: string; symbol: string } => item !== null);

            // Create attendance records for each symbol
            for (const { date, symbol } of attendanceSymbols) {
                let status: AttendanceStatus;
                let justification: JustificationReason | null = null;
                let timeIn: string | null = null;

                // Determine status and time based on symbol
                switch (symbol.toUpperCase()) {
                    case 'A':
                        status = AttendanceStatus.PRESENT;
                        timeIn = getRandomTimeBetween('13:30', '16:00');
                        break;
                    case 'X':
                        status = AttendanceStatus.ABSENT;
                        break;
                    case 'L':
                        status = AttendanceStatus.LATE;
                        timeIn = getRandomTimeBetween('13:30', '16:00');
                        break;
                    case '*':
                        // Randomly choose between LATE and ABSENT
                        status = Math.random() < 0.5 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT;
                        if (status === AttendanceStatus.LATE) {
                            timeIn = getRandomTimeBetween('13:30', '16:00');
                            // Random justification for late
                            justification = Math.random() < 0.5 ? JustificationReason.WORK : JustificationReason.OTHER;
                        } else {
                            // Random justification for absent
                            justification = Math.random() < 0.5 ? JustificationReason.WORK : JustificationReason.OTHER;
                        }
                        break;
                    default:
                        continue; // Skip unknown symbols
                }

                // Insert using raw SQL to avoid TypeORM's type conversion
                await dataSource.query(`
                    INSERT INTO attendance (
                        "userId", "eventType", "date", 
                        "timeIn", "status", "type",
                        "justification", "createdAt", "updatedAt"
                    ) VALUES (
                        $1, $2, $3, $4::time, $5, $6, $7, NOW(), NOW()
                    )
                `, [
                    user.id,
                    AttendanceEventType.REHEARSAL,
                    date,
                    timeIn,
                    status,
                    AttendanceType.MANUAL,
                    justification
                ]);

                recordsCreated++;
            }
        }
        
        console.log(`Created ${recordsCreated} rehearsal attendance records from CSV`);
    } catch (error) {
        console.error('Error seeding attendance:', error);
        throw error;
    }
}; 