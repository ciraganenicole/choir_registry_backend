import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { Leave } from '../leave/leave.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '2022',
  database: 'choir_registry',
  entities: [User, Attendance, Leave],
  synchronize: true,
});

const getRandomStatus = (): AttendanceStatus => {
  const statuses = [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const getWeekDatesForSpecificDays = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // Get the current day of the week (0 for Sunday, 1 for Monday, etc.)

  // Define the days to seed: Lundi (Monday), Jeudi (Thursday), Samedi (Saturday), Dimanche (Sunday)
  const targetDays = [1, 4, 6, 0]; // Lundi = 1, Jeudi = 4, Samedi = 6, Dimanche = 0

  targetDays.forEach((targetDay) => {
    const date = new Date();
    const daysDifference = (dayOfWeek - targetDay + 7) % 7; // Calculate the difference to the target day
    date.setDate(today.getDate() - daysDifference); // Set the date to the target day
    dates.push(date.toISOString().split('T')[0]); // Add the formatted date to the array
  });

  // Ensure Dimanche (Sunday) 2025-02-23 is included
  if (!dates.includes('2025-02-23')) {
    dates.push('2025-02-23');
  }

  return dates;
};

const seedAttendance = async () => {
  await AppDataSource.initialize();
  console.log('Database connected');

  const userRepository = AppDataSource.getRepository(User);
  const attendanceRepository = AppDataSource.getRepository(Attendance);
  const leaveRepository = AppDataSource.getRepository(Leave);

  const users = await userRepository.find();

  if (!users.length) {
    console.error('No users found. Please add users before seeding attendance.');
    return;
  }

  const dates = getWeekDatesForSpecificDays(); // Get specific week dates (Lundi, Jeudi, Samedi, Dimanche)

  for (const user of users) {
    // Check if the user is on leave
    const userOnLeave = await leaveRepository.findOne({
      where: {
        user: { id: user.id },
        endDate: null, // Check for active leave
      },
    });

    if (userOnLeave) {
      console.log(`Skipping attendance for user ${user.id} on leave.`);
      continue; // Skip this user if they are on leave
    }

    // Seed attendance records for this user if they are not on leave
    for (const date of dates) {
      const attendance = new Attendance();
      attendance.user = user;
      attendance.date = date;
      attendance.dateTime = `${Math.floor(Math.random() * 12) + 7}:00:00`; // Random time between 7:00 AM and 7:59 AM
      attendance.status = getRandomStatus(); // Random status
      attendance.justified = attendance.status === AttendanceStatus.LATE && Math.random() < 0.5; // 50% chance to justify lateness

      await attendanceRepository.save(attendance);
      console.log(`Attendance saved for ${user.id} on ${date}`);
    }
  }

  console.log('Attendance seeding completed');
  await AppDataSource.destroy();
};

seedAttendance().catch((error) => console.error('Error seeding attendance:', error));
