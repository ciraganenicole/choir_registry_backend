import { DataSource } from 'typeorm';
import { Leave } from '../../modules/leave/leave.entity';
import { User } from '../../modules/users/user.entity';
import { LeaveStatus } from '../../modules/leave/leave-status.enum';

export const seedLeaves = async (dataSource: DataSource) => {
  const leaveRepository = dataSource.getRepository(Leave);
  const userRepository = dataSource.getRepository(User);

  // Get some users to assign leaves to
  const users = await userRepository.find({ take: 5 });

  const leaves = [
    {
      user: users[0],
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      reason: 'Family vacation',
      status: LeaveStatus.APPROVED
    },
    {
      user: users[1],
      startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      reason: 'Medical appointment',
      status: LeaveStatus.PENDING
    },
    {
      user: users[2],
      startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 12)),
      reason: 'Personal matters',
      status: LeaveStatus.REJECTED
    },
    {
      user: users[3],
      startDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 17)),
      reason: 'Wedding ceremony',
      status: LeaveStatus.APPROVED
    },
    {
      user: users[4],
      startDate: new Date(new Date().setDate(new Date().getDate() + 20)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 22)),
      reason: 'Family emergency',
      status: LeaveStatus.PENDING
    }
  ];

  for (const leave of leaves) {
    const existingLeave = await leaveRepository.findOne({
      where: {
        user: { id: leave.user.id },
        startDate: leave.startDate
      }
    });

    if (!existingLeave) {
      await leaveRepository.save(leave);
    }
  }
}; 