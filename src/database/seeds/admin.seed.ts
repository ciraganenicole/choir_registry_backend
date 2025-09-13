import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../modules/admin/admin_users.entity';
import { AdminRole } from '../../modules/admin/admin-role.enum';

export const adminSeeder = async (dataSource: DataSource) => {
  const adminRepository = dataSource.getRepository(AdminUser);

  const admins = [
    {
      email: 'admin@gmail.com',
      username: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
      password: 'admin2025'
    },
    {
      email: 'registre@gmail.com',
      username: 'Attendance Admin',
      role: AdminRole.ATTENDANCE_ADMIN,
      password: 'registre2025'
    },
    {
      email: 'finance@gmail.com',
      username: 'Finance Admin',
      role: AdminRole.FINANCE_ADMIN,
      password: 'finance2025'
    },
  ];

  for (const adminData of admins) {
    try {
      const existingAdmin = await adminRepository.findOne({
        where: { email: adminData.email },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        const admin = adminRepository.create({
          ...adminData,
          password: hashedPassword,
          isActive: true,
        });
        await adminRepository.save(admin);
      } else {
        console.log(`Admin already exists: ${adminData.email}`);
      }
    } catch (error) {
      console.error(`Error creating admin ${adminData.email}:`, error);
    }
  }
}; 