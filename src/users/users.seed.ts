import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from './user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const users: User[] = Array.from({ length: 15 }, () => {
    const user = new User();
    user.name = faker.person.firstName();
    user.surname = faker.person.lastName();
    user.phoneNumber = `+243 ${faker.number.int({ min: 100000000, max: 999999999 })}`;
    user.matricule = faker.string.alphanumeric(8).toUpperCase();
    user.publicKey = faker.string.alphanumeric(64);
    user.challenge = faker.string.uuid();
    user.counter = faker.number.int({ min: 0, max: 100 });
    user.credentialID = faker.string.alphanumeric(32);

    return user;
  });

  await userRepository.save(users);
  console.log('✅ 15 users seeded successfully!');
}

// Usage example (e.g., in your main.ts or a seed script)
// import { AppDataSource } from '../data-source';
// AppDataSource.initialize().then(async () => {
//   await seedUsers(AppDataSource);
//   process.exit(0);
// });
