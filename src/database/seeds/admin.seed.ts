import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../modules/admin/admin_users.entity';
import { AdminRole } from '../../modules/admin/admin-role.enum';

export const adminSeeder = async (dataSource: DataSource) => {
  const adminRepository = dataSource.getRepository(AdminUser);
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admins = [
    {
      email: 'superadmin@example.com',
      username: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
    },
    {
      email: 'adminlouado@example.com',
      username: 'Louado Admin',
      role: AdminRole.LOUADO_ADMIN,
    },
    {
      email: 'adminadmin@example.com',
      username: 'Administration Admin',
      role: AdminRole.ADMINISTRATION_ADMIN,
    },
    {
      email: 'admincaisse@example.com',
      username: 'Caisse Admin',
      role: AdminRole.CAISSE_ADMIN,
    },
  ];

  console.log('Starting to seed admin users...');

  for (const adminData of admins) {
    try {
      const existingAdmin = await adminRepository.findOne({
        where: { email: adminData.email },
      });

      if (!existingAdmin) {
        console.log(`Creating admin: ${adminData.email}`);
        const admin = adminRepository.create({
          ...adminData,
          password: hashedPassword,
          isActive: true,
        });
        await adminRepository.save(admin);
        console.log(`Created admin: ${adminData.email}`);
      } else {
        console.log(`Admin already exists: ${adminData.email}`);
      }
    } catch (error) {
      console.error(`Error creating admin ${adminData.email}:`, error);
    }
  }

  console.log('Admin seeding completed');
}; 