/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { UserCategory } from '../../modules/users/enums/user-category.enum';
import { Gender } from '../../modules/users/enums/gender.enum';
import { MaritalStatus } from '../../modules/users/enums/marital-status.enum';
import { EducationLevel } from '../../modules/users/enums/education-level.enum';
import { Profession } from '../../modules/users/enums/profession.enum';
import { Commune } from '../../modules/users/enums/commune.enum';
import { Commission } from '../../modules/users/enums/commission.enum';

const usersData = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.SINGLE,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.NGO_WORKER,
    competenceDomain: 'Project Management',
    churchOfOrigin: 'CELPA Goma',
    commune: Commune.GOMA,
    quarter: 'Himbi',
    reference: 'Near Hospital',
    address: 'Av. Lake Kivu, 123',
    phoneNumber: '+237650123001',
    whatsappNumber: '+237650123001',
    email: 'sarah.j@example.com',
    commissions: [Commission.SINGING_MUSIC],
    categories: [UserCategory.WORSHIPPER],
    
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    educationLevel: EducationLevel.MASTER,
    profession: Profession.FREELANCE,
    competenceDomain: 'Public Policy',
    churchOfOrigin: 'CELPA Kisangani',
    commune: Commune.KARISIMBI,
    quarter: 'Kibati',
    reference: 'Near City Hall',
    address: 'Av. Kisangani, 456',
    phoneNumber: '+237650123002',
    whatsappNumber: '+237650123002',
    email: 'michael.b@example.com',
    commissions: [Commission.AESTHETICS],
    categories: [UserCategory.COMMITTEE],
    
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.DIVORCED,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.NGO_WORKER,
    competenceDomain: 'Environmental Science',
    churchOfOrigin: 'CELPA Kinshasa',
    commune: Commune.GOMA,
    quarter: 'Nzambi',
    reference: 'Near University',
    address: 'Av. Lumumba, 789',
    phoneNumber: '+237650123003',
    whatsappNumber: '+237650123003',
    email: 'emily.d@example.com',
    commissions: [],
    categories: [],
    
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.WIDOWED,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.CIVIL_SERVANT,
    competenceDomain: 'Marketing',
    churchOfOrigin: 'CELPA Boma',
    commune: Commune.GOMA,
    quarter: 'Makanza',
    reference: 'Near Market',
    address: 'Av. Boma, 101',
    phoneNumber: '+237650123004',
    whatsappNumber: '+237650123004',
    email: 'james.w@example.com',
    commissions: [Commission.AESTHETICS],
    categories: [UserCategory.WORSHIPPER, UserCategory.COMMITTEE],
    
  },
  {
    firstName: 'David',
    lastName: 'Taylor',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.SINGLE,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.UNEMPLOYED,
    competenceDomain: 'Civil Engineering',
    churchOfOrigin: 'CELPA Douala',
    commune: Commune.GOMA,
    quarter: 'Bonaberi',
    reference: 'Near Office',
    address: 'Av. Douala, 234',
    phoneNumber: '+237650123005',
    whatsappNumber: '+237650123005',
    email: 'david.t@example.com',
    commissions: [],
    categories: [],
    
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.MARRIED,
    educationLevel: EducationLevel.A2,
    profession: Profession.CIVIL_SERVANT,
    competenceDomain: 'Pediatrics',
    churchOfOrigin: 'CELPA Yaoundé',
    commune: Commune.GOMA,
    quarter: 'Nkolbisson',
    reference: 'Near Clinic',
    address: 'Av. Yaoundé, 567',
    phoneNumber: '+237650123006',
    whatsappNumber: '+237650123006',
    email: 'lisa.a@example.com',
    commissions: [],
    categories: [],
    
  },
  {
    firstName: 'Robert',
    lastName: 'Thomas',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.SINGLE,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.CIVIL_SERVANT,
    competenceDomain: 'Mathematics',
    churchOfOrigin: 'CELPA Bafoussam',
    commune: Commune.GOMA,
    quarter: 'Bafoussam',
    reference: 'Near School',
    address: 'Av. Bafoussam, 890',
    phoneNumber: '+237650123007',
    whatsappNumber: '+237650123007',
    email: 'robert.t@example.com',
    commissions: [],
    categories: [],
    
  },
  {
    firstName: 'Jennifer',
    lastName: 'Martinez',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.MARRIED,
    educationLevel: EducationLevel.MASTER,
    profession: Profession.CIVIL_SERVANT,
    competenceDomain: 'Criminal Law',
    churchOfOrigin: 'CELPA Dakar',
    commune: Commune.KARISIMBI,
    quarter: 'Dakar',
    reference: 'Near Court',
    address: 'Av. Dakar, 112',
    phoneNumber: '+237650123008',
    whatsappNumber: '+237650123008',
    email: 'jennifer.m@example.com',
    commissions: [Commission.SINGING_MUSIC],
    categories: [UserCategory.COMMITTEE],
    
  },
  {
    firstName: 'Daniel',
    lastName: 'Garcia',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.SINGLE,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.FREELANCE,
    competenceDomain: 'Financial Accounting',
    churchOfOrigin: 'CELPA Santiago',
    commune: Commune.KARISIMBI,
    quarter: 'Santiago',
    reference: 'Near Bank',
    address: 'Av. Santiago, 345',
    phoneNumber: '+237650123009',
    whatsappNumber: '+237650123009',
    email: 'daniel.g@example.com',
    commissions: [Commission.SINGING_MUSIC],
    categories: [UserCategory.WORSHIPPER],
    
  },
  {
    firstName: 'Michelle',
    lastName: 'Robinson',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.DIVORCED,
    educationLevel: EducationLevel.INCOMPLETE_HUMANITIES,
    profession: Profession.NGO_WORKER,
    competenceDomain: 'Environmental Science',
    churchOfOrigin: 'CELPA Kinshasa',
    commune: Commune.GOMA,
    quarter: 'Nzambi',
    reference: 'Near University',
    address: 'Av. Lumumba, 678',
    phoneNumber: '+237650123010',
    whatsappNumber: '+237650123010',
    email: 'michelle.r@example.com',
    commissions: [],
    categories: [],
    
  },
  {
    firstName: 'Kevin',
    lastName: 'Lee',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    educationLevel: EducationLevel.MASTER,
    profession: Profession.CIVIL_SERVANT,
    competenceDomain: 'Public Policy',
    churchOfOrigin: 'CELPA Yaoundé',
    commune: Commune.GOMA,
    quarter: 'Nkolbisson',
    reference: 'Near Clinic',
    address: 'Av. Yaoundé, 901',
    phoneNumber: '+237650123011',
    whatsappNumber: '+237650123011',
    email: 'kevin.l@example.com',
    commissions: [Commission.AESTHETICS],
    categories: [UserCategory.COMMITTEE],
    
  },
  {
    firstName: 'Amanda',
    lastName: 'Walker',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.SINGLE,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.UNEMPLOYED,
    competenceDomain: 'Marketing',
    churchOfOrigin: 'CELPA Bafoussam',
    commune: Commune.KARISIMBI,
    quarter: 'Bafoussam',
    reference: 'Near School',
    address: 'Av. Bafoussam, 234',
    phoneNumber: '+237650123012',
    whatsappNumber: '+237650123012',
    email: 'amanda.w@example.com',
    commissions: [Commission.SINGING_MUSIC],
    categories: [UserCategory.WORSHIPPER],
    
  },
  {
    firstName: 'Christopher',
    lastName: 'Hall',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.WIDOWED,
    educationLevel: EducationLevel.GRADUATE,
    profession: Profession.CIVIL_SERVANT,
    competenceDomain: 'Environmental Science',
    churchOfOrigin: 'CELPA Douala',
    commune: Commune.GOMA,
    quarter: 'Bonaberi',
    reference: 'Near Office',
    address: 'Av. Douala, 567',
    phoneNumber: '+237650123013',
    whatsappNumber: '+237650123013',
    email: 'christopher.h@example.com',
    commissions: [],
    categories: [],
    
  },
  {
    firstName: 'Jessica',
    lastName: 'Allen',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.MARRIED,
    educationLevel: EducationLevel.MASTER,
    profession: Profession.FREELANCE,
    competenceDomain: 'Criminal Law',
    churchOfOrigin: 'CELPA Dakar',
    commune: Commune.GOMA,
    quarter: 'Dakar',
    reference: 'Near Court',
    address: 'Av. Dakar, 890',
    phoneNumber: '+237650123014',
    whatsappNumber: '+237650123014',
    email: 'jessica.a@example.com',
    commissions: [Commission.AESTHETICS],
    categories: [UserCategory.COMMITTEE],
    
  },
  {
    firstName: 'Matthew',
    lastName: 'Young',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.SINGLE,
    educationLevel: EducationLevel.BACHELOR,
    profession: Profession.UNEMPLOYED,
    competenceDomain: 'Mathematics',
    churchOfOrigin: 'CELPA Bafoussam',
    commune: Commune.GOMA,
    quarter: 'Bafoussam',
    reference: 'Near School',
    address: 'Av. Bafoussam, 101',
    phoneNumber: '+237650123015',
    whatsappNumber: '+237650123015',
    email: 'matthew.y@example.com',
    commissions: [],
    categories: [UserCategory.WORSHIPPER],
    
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
        console.log(`Creating user: ${userData.firstName} ${userData.lastName}`);
        const user = userRepository.create(userData);
        await userRepository.save(user);

        // Set the matricule after saving the user
        user.matricule = `NJC-${user.id}`;
        await userRepository.save(user);

        console.log(`Created user: ${userData.firstName} ${userData.lastName} with matricule: ${user.matricule}`);
      } else {
        console.log(`User already exists: ${userData.firstName} ${userData.lastName}`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.firstName} ${userData.lastName}:`, error);
    }
  }

  console.log('User seeding completed');
};
