/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { UserCategory } from '../../modules/users/user-category.enum';
import { VoiceCategory } from '../../modules/users/voice-category.enum';

const usersData = [
  {
    name: 'Sarah',
    surname: 'Johnson',
    phoneNumber: '+237650123001',
    categories: [UserCategory.WORSHIPPER],
    voiceCategory: VoiceCategory.SOPRANO,
  },
  {
    name: 'Michael',
    surname: 'Brown',
    phoneNumber: '+237650123002',
    categories: [UserCategory.COMMITTEE],
    voiceCategory: VoiceCategory.TENOR,
  },
  {
    name: 'Emily',
    surname: 'Davis',
    phoneNumber: '+237650123003',
    categories: [],
    voiceCategory: VoiceCategory.ALTO,
  },
  {
    name: 'James',
    surname: 'Wilson',
    phoneNumber: '+237650123004',
    categories: [UserCategory.WORSHIPPER, UserCategory.COMMITTEE],
    voiceCategory: VoiceCategory.SOPRANO,
  },
  {
    name: 'David',
    surname: 'Taylor',
    phoneNumber: '+237650123005',
    categories: [],
    voiceCategory: VoiceCategory.SOPRANO,
  },
  {
    name: 'Lisa',
    surname: 'Anderson',
    phoneNumber: '+237650123006',
    categories: [],
    voiceCategory: VoiceCategory.ALTO,
  },
  {
    name: 'Robert',
    surname: 'Thomas',
    phoneNumber: '+237650123007',
    categories: [],
    voiceCategory: VoiceCategory.TENOR,
  },
  {
    name: 'Jennifer',
    surname: 'Martinez',
    phoneNumber: '+237650123008',
    categories: [UserCategory.COMMITTEE],
    voiceCategory: VoiceCategory.MUSICIANS,
  },
  {
    name: 'Daniel',
    surname: 'Garcia',
    phoneNumber: '+237650123009',
    categories: [UserCategory.WORSHIPPER],
    voiceCategory: VoiceCategory.TENOR,
  },
  {
    name: 'Michelle',
    surname: 'Robinson',
    phoneNumber: '+237650123010',
    categories: [],
    voiceCategory: VoiceCategory.ALTO,
  },
  {
    name: 'Kevin',
    surname: 'Lee',
    phoneNumber: '+237650123011',
    categories: [UserCategory.COMMITTEE],
    voiceCategory: VoiceCategory.MUSICIANS,
  },
  {
    name: 'Amanda',
    surname: 'Walker',
    phoneNumber: '+237650123012',
    categories: [UserCategory.WORSHIPPER],
    voiceCategory: VoiceCategory.MUSICIANS,
  },
  {
    name: 'Christopher',
    surname: 'Hall',
    phoneNumber: '+237650123013',
    categories: [],
    voiceCategory: VoiceCategory.SOPRANO,
  },
  {
    name: 'Jessica',
    surname: 'Allen',
    phoneNumber: '+237650123014',
    categories: [UserCategory.COMMITTEE],
    voiceCategory: VoiceCategory.SOPRANO,
  },
  {
    name: 'Matthew',
    surname: 'Young',
    phoneNumber: '+237650123015',
    categories: [UserCategory.WORSHIPPER],
    voiceCategory: VoiceCategory.SOPRANO,
  },
];

export const userSeeder = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  console.log('Starting to seed users...');

  for (const userData of usersData) {
    try {
      const existingUser = await userRepository.findOne({
        where: { phoneNumber: userData.phoneNumber },
      });

      if (!existingUser) {
        console.log(`Creating user: ${userData.name} ${userData.surname}`);
        const user = userRepository.create(userData);
        await userRepository.save(user);

        // Set the matricule after saving the user
        user.matricule = `NJC-${user.id}`;
        await userRepository.save(user);

        console.log(`Created user: ${userData.name} ${userData.surname} with matricule: ${user.matricule}`);
      } else {
        console.log(`User already exists: ${userData.name} ${userData.surname}`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.name} ${userData.surname}:`, error);
    }
  }

  console.log('User seeding completed');
};
