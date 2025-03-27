import { DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { UserCategory } from '../../modules/users/enums/user-category.enum';

export const seedUsers = async (dataSource: DataSource): Promise<void> => {
    try {
        const userRepository = dataSource.getRepository(User);

        // Set a consistent join date for all users (e.g., January 1st, 2024)
        const joinDate = new Date('2025-01-01');
        joinDate.setHours(0, 0, 0, 0);

        // List of users from CSV
        const users = [
            { firstName: 'Chimonge', lastName: 'Adelle' },
            { firstName: 'Ngoma', lastName: 'Agisha' },
            { firstName: 'Muhima', lastName: 'Aimé' },
            { firstName: 'Kahusi', lastName: 'Alice' },
            { firstName: 'Bisimwa', lastName: 'Amani' },
            { firstName: 'Mwinyi', lastName: 'Ange' },
            { firstName: 'Mirimba', lastName: 'Angel' },
            { firstName: 'Mutunzi', lastName: 'Arcadius' },
            { firstName: 'Chibikwa', lastName: 'Atosha' },
            { firstName: 'Mapendo', lastName: 'Augustin' },
            { firstName: 'Cimalamungo', lastName: 'Baudouin' },
            { firstName: 'Muhima', lastName: 'Béatric' },
            { firstName: 'Chibalonza', lastName: 'Béatric' },
            { firstName: 'Zanga', lastName: 'Bernadette' },
            { firstName: 'Ntaboba', lastName: 'Bertin' },
            { firstName: 'Muhima', lastName: 'Bindja' },
            { firstName: 'Migigo', lastName: 'Binja' },
            { firstName: 'Masudi', lastName: 'Bonny' },
            { firstName: 'Bulonza', lastName: 'Charline' },
            { firstName: 'Mpembe', lastName: 'Christine' },
            { firstName: 'Batumike', lastName: 'Clara' },
            { firstName: 'Batumike', lastName: 'Clarice' },
            { firstName: 'Katankusa', lastName: 'Colette' },
            { firstName: 'Kaseka', lastName: 'Corine' },
            { firstName: 'Ifodji', lastName: 'Daniel' },
            { firstName: 'Badesire', lastName: 'Daniel' },
            { firstName: 'Marhegeko', lastName: 'David' },
            { firstName: 'Buhendwa', lastName: 'Diane' },
            { firstName: 'Ziruka', lastName: 'Divine' },
            { firstName: 'Bateyi', lastName: 'Donnel' },
            { firstName: 'Masiri', lastName: 'Elodie' },
            { firstName: 'Mishuli', lastName: 'Emmanuel' },
            { firstName: 'Sadiki', lastName: 'Esther' },
            { firstName: 'Ntamulike', lastName: 'Esther' },
            { firstName: 'Soki', lastName: 'Esther' },
            { firstName: 'Chikwanine', lastName: 'Esther' },
            { firstName: 'Mangaza', lastName: 'Esther' },
            { firstName: 'Furaha', lastName: 'Esther' },
            { firstName: 'Amisi', lastName: 'Fiston' },
            { firstName: 'Kibandja', lastName: 'Florence' },
            { firstName: 'Abibu', lastName: 'Florent' },
            { firstName: 'Siri', lastName: 'Fortune' },
            { firstName: 'Bisimwa', lastName: 'Francine' },
            { firstName: 'Muhima', lastName: 'Francine' },
            { firstName: 'Murhola', lastName: 'François' },
            { firstName: 'Nshiku', lastName: 'Gisele' },
            { firstName: 'Ifodji', lastName: 'Grace' },
            { firstName: 'Batumike', lastName: 'Gracia' },
            { firstName: 'Awazi', lastName: 'Guelord' },
            { firstName: 'Katoto', lastName: 'Hermene' },
            { firstName: 'Asane', lastName: 'Hortense' },
            { firstName: 'Mupango', lastName: 'Innoncent' },
            { firstName: 'Kapinga', lastName: 'Isabelle' },
            { firstName: 'Kitsa', lastName: 'Jadakim' },
            { firstName: "Beng'hantundu", lastName: 'Jaelle' },
            { firstName: 'Bwalitse', lastName: 'Jean' },
            { firstName: 'Safari', lastName: 'Jeanne' },
            { firstName: 'Ifodji', lastName: 'Joelle' },
            { firstName: 'Aganze', lastName: 'John' },
            { firstName: 'Bashizi', lastName: 'Jolie' },
            { firstName: 'Kisumba', lastName: 'Jolie' },
            { firstName: 'Byamungu', lastName: 'Jonathan' },
            { firstName: 'Amani', lastName: 'Jonathan' },
            { firstName: 'Bwira', lastName: 'Jordan' },
            { firstName: 'Bahizire', lastName: 'Judith' },
            { firstName: 'Chimalamungo', lastName: 'Justine' },
            { firstName: 'Musavuli', lastName: 'Kavira' },
            { firstName: 'Bahizire', lastName: 'Kethia' },
            { firstName: 'Bashige', lastName: 'Kito' },
            { firstName: 'Iragi', lastName: 'Koko' },
            { firstName: 'Ntumba', lastName: 'Linda' },
            { firstName: 'Mubalama', lastName: 'Maombi' },
            { firstName: 'Mushagalusa', lastName: 'Marc' },
            { firstName: 'Cizungu', lastName: 'Merveille' },
            { firstName: 'Faraja', lastName: 'Monique' },
            { firstName: 'Mubalama', lastName: 'Mwamini' },
            { firstName: 'Bugondo', lastName: 'Nadine' },
            { firstName: 'Miradi', lastName: 'Nathalie' },
            { firstName: 'Neema', lastName: 'Nenette' },
            { firstName: 'Nshiku', lastName: 'Nicole' },
            { firstName: 'Ciragane', lastName: 'Nicole' },
            { firstName: 'Kashemwa', lastName: 'Noella' },
            { firstName: 'Safari', lastName: 'Noella' },
            { firstName: 'Kahindo', lastName: 'Noella' },
            { firstName: 'Mubalama', lastName: 'Nsimre' },
            { firstName: 'Mulonda', lastName: 'Nyota' },
            { firstName: 'Sitono', lastName: 'Pauline' },
            { firstName: 'Lupembe', lastName: 'Pierre' },
            { firstName: 'Muhima', lastName: 'Prince' },
            { firstName: 'Akonkwa', lastName: 'Rachel' },
            { firstName: 'Binenwa', lastName: 'Riziki' },
            { firstName: 'Mubalama', lastName: 'Riziki' },
            { firstName: 'Lumoo', lastName: 'Riziki' },
            { firstName: 'Banywesize', lastName: 'Rosette' },
            { firstName: 'Mirindi', lastName: 'Sephora' },
            { firstName: 'Mubalama', lastName: 'Sifa' },
            { firstName: 'Muvanga', lastName: 'Sifa' },
            { firstName: 'Mwanvuwa', lastName: 'Sifa' },
            { firstName: 'Nyota', lastName: 'Suzane' },
            { firstName: 'Alingi', lastName: 'Sylvie' },
            { firstName: 'Bushashire', lastName: 'Thierry' },
            { firstName: 'Mirimba', lastName: 'Tubuni' },
            { firstName: 'Bahizire', lastName: 'Tumusifu' },
            { firstName: 'Minani', lastName: 'Yvonne' },
            { firstName: 'Kubuya', lastName: 'Zawadi' },
            { firstName: 'Zihindula', lastName: 'Zed' },
            { firstName: 'Nguduka', lastName: 'Zishi' }
        ];

        // Create users with default values
        for (const userData of users) {
            const user = new User();
            Object.assign(user, {
                ...userData,
                categories: [UserCategory.NORMAL],
                isActive: true,
                joinDate: joinDate
            });

            const savedUser = await userRepository.save(user);

      // Update matricule after saving
      await userRepository.update(savedUser.id, {
        matricule: `NJC-${savedUser.id}-2025`
      });
        }

        console.log(`Created ${users.length} users`);
    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    }
}; 