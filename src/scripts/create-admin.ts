import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../modules/admin/admin_users.entity';
import { config } from 'dotenv';
import { Table } from 'typeorm';

config();

const createAdmin = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [AdminUser],
    logging: true,
  });

  try {

    await dataSource.initialize();

    const queryRunner = dataSource.createQueryRunner();
    const tableExists = await queryRunner.hasTable('admin_users');

    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'admin_users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'email',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'password',
              type: 'varchar',
            },
            {
              name: 'name',
              type: 'varchar',
            },
            {
              name: 'role',
              type: 'enum',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
          ],
        }),
        true
      );
    }

    const adminRepository = dataSource.getRepository(AdminUser);
    
    const existingAdmins = await adminRepository.find();

    const hashedPassword = await bcrypt.hash('password123', 10);

    const admins = [
      {
        email: 'superadmin@example.com',
        name: 'Super Admin',
      },
      {
        email: 'adminlouado@example.com',
        name: 'Louado Admin',
      },
      {
        email: 'adminadmin@example.com',
        name: 'Administration Admin',
      },
      {
        email: 'admincaisse@example.com',
        name: 'Caisse Admin',
      },
    ];

    for (const adminData of admins) {
      try {
        const existingAdmin = await adminRepository.findOne({
          where: { email: adminData.email },
        });

        if (!existingAdmin) {
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
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await dataSource.destroy();
  }
};

createAdmin(); 