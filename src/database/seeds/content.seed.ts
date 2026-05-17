import { DataSource } from 'typeorm';
import { ContentType } from '../../modules/content/content-type.entity';
import { ContentFieldDefinition } from '../../modules/content/content-field-definition.entity';
import { Content } from '../../modules/content/content.entity';
import { ContentFieldType } from '../../modules/content/enums/content-field-type.enum';
import { ContentStatus } from '../../modules/content/enums/content-status.enum';
import { ContentVisibility } from '../../modules/content/enums/content-visibility.enum';
import {
  Song,
  SongDifficulty,
  SongStatus,
} from '../../modules/song/song.entity';

type InlineSeedSong = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration: string;
};

const churchEventsData = [
  {
    slug: 'semaine-de-priere-2026',
    title: 'Semaine de Prière',
    dateLabel: '10 – 16 mars 2026',
    startDate: '2026-03-10',
    endDate: '2026-03-16',
    locationShort: 'Église CELPA Salem',
    addressLines: 'Église CELPA Salem\nAvenue de la Paix, N° 42\nCommune de Lingwala, Kinshasa',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249.7!2d29.22!3d-1.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNDAnMTguMk0gMjnCsDEzJzI4LjgiUiA1mcKwMDInMy44Mg!5e0!3m2!1sfr!2scd!4v1',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80',
    summary: 'Une semaine dédiée à la prière et au jeûne communautaire.',
    bodyParagraphs: [
      'Une semaine entière est offerte à l\'église pour chercher Dieu ensemble : louanges, témoignages, temps d\'intercession et enseignements brefs pour fortifier la foi.',
      'Chaque soirée accueille des familles, des jeunes et des serviteurs autour d\'un même désir : la présence du Seigneur au milieu de son peuple.',
      'Le jeûne partiel est proposé selon la mesure de chacun ; l\'accent est mis sur l\'unité d\'esprit et la persévérance dans la prière.',
    ],
    program: [
      { timeRange: '18h30 – 19h00', title: 'Accueil et louange', description: 'Moments d\'adoration collective et annonces.' },
      { timeRange: '19h00 – 19h40', title: 'Méditation biblique', description: 'Lecture et brève méditation sur un passage des Psaumes.' },
      { timeRange: '19h40 – 20h30', title: 'Prière d\'intercession', description: 'Priorité : l\'Église, les familles, la nation et les missions.' },
      { timeRange: '20h30 – 21h00', title: 'Clôture', description: 'Bénédiction et partage fraternel.' },
    ],
    moderators: [
      { name: 'Pasteur Jacques Müller', roleTitle: 'Modérateur spirituel — Semaine de prière', bio: 'Responsable de l\'enseignement et de la coordination des temps de louange.', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&q=80&fit=crop' },
      { name: 'Sœur Grace Kabongo', roleTitle: 'Animatrice de l\'intercession', bio: 'Coordonne les segments de prière et l\'accompagnement des groupes.' },
      { name: 'Diacre Samuel T.', roleTitle: 'Hôte d\'accueil et logistique', bio: 'S\'assure du bon déroulement des soirées et de la sécurité des participants.', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80&fit=crop' },
    ],
  },
  {
    slug: 'conference-de-la-foi-2026',
    title: 'Conférence de la Foi',
    dateLabel: '5 avril 2026',
    startDate: '2026-04-05',
    endDate: '2026-04-05',
    locationShort: 'Salle polyvalente — Goma',
    addressLines: 'Salle polyvalente CELPA Salem\nAvenue de la Victoire (annexe)\nGoma — Nord Kivu',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249.7!2d29.22!3d-1.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNDAnMTguMk0gMjnCsDEzJzI4LjgiUiA1mcKwMDInMy44Mg!5e0!3m2!1sfr!2scd!4v1',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80',
    summary: 'Enseignements avec orateurs invités.',
    bodyParagraphs: [
      'La conférence propose des sessions accessibles à tous, axées sur les fondements de la foi réformée et la vie disciples aujourd\'hui.',
      'Des pauses questions-réponses permettent d\'approfondir les sujets traités ; les notes de session seront partagées après l\'événement.',
    ],
    program: [
      { timeRange: '08h30 – 09h00', title: 'Ouverture — café d\'accueil' },
      { timeRange: '09h00 – 10h30', title: 'Session 1 — Fondements scripturaires', description: 'Le rapport Écriture, foi et pratique ecclésiale.' },
      { timeRange: '10h45 – 12h15', title: 'Session 2 — Témoignage et mission' },
      { timeRange: '14h00 – 15h30', title: 'Atelier — tables rondes', description: 'Discussions guidées par les diacres et anciens.' },
      { timeRange: '16h00 – 17h00', title: 'Culte de clôture et envoi' },
    ],
    moderators: [
      { name: 'Pasteur Émile Nlandu (invité)', roleTitle: 'Conférencier principal', bio: 'Théologien et pasteur ; interviendra sur les deux sessions du matin.', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80&fit=crop' },
      { name: 'Sœur Marie K.', roleTitle: 'Modératrice des débats', bio: 'Anime les échanges et le respect du temps de parole.' },
      { name: 'Elder Paul M.', roleTitle: 'Responsable liturgique — culte de clôture', imageUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=256&q=80&fit=crop' },
    ],
  },
  {
    slug: 'concert-de-louange-2026',
    title: 'Concert de Louange',
    dateLabel: '20 avril 2026',
    startDate: '2026-04-20',
    endDate: '2026-04-20',
    locationShort: 'Église CELPA Salem — Goma',
    addressLines: 'Église CELPA Salem\nAvenue de la Victoire, N° 12\nCommune de Goma, Nord Kivu',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249.7!2d29.22!3d-1.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNDAnMTguMk0gMjnCsDEzJzI4LjgiUiA1mcKwMDInMy44Mg!5e0!3m2!1sfr!2scd!4v1',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    summary: 'Une soirée de louange et d\'adoration en musique.',
    bodyParagraphs: [
      'Le concert rassemble chœur, musiciens et invités pour célébrer la foi à travers des répertoires contemporains et traditions luthériennes adaptées.',
      'Entrée libre avec quête pour le fonds mission ; familles et jeunes sont les bienvenus.',
    ],
    program: [
      { timeRange: '18h00', title: 'Ouverture des portes' },
      { timeRange: '18h30 – 19h00', title: 'Acoustique et accueil des enfants' },
      { timeRange: '19h00 – 20h15', title: 'Set principal — chorale Salem' },
      { timeRange: '20h15 – 20h45', title: 'Intervention invitée — groupe partenaire' },
      { timeRange: '20h45 – 21h30', title: 'Adoration finale et partage' },
    ],
    moderators: [
      { name: 'Frère David L.', roleTitle: 'Directeur artistique — concert', bio: 'Chef de la chorale et coordination artistique de la soirée.', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80&fit=crop' },
      { name: 'Sœur Esther B.', roleTitle: 'Animatrice de parole et transitions' },
      { name: 'Pasteur Jacques Müller', roleTitle: 'Modérateur spirituel — bénédiction finale', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&q=80&fit=crop' },
    ],
  },
  {
    slug: 'veillee-de-priere-2025',
    title: 'Veillée de prière de fin d\'année',
    dateLabel: '15 décembre 2025',
    startDate: '2025-12-15',
    endDate: '2025-12-15',
    locationShort: 'Église CELPA Salem — Goma',
    addressLines: 'Église CELPA Salem\nAvenue de la Victoire, N° 12\nCommune de Goma, Nord Kivu',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249.7!2d29.22!3d-1.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNDAnMTguMk0gMjnCsDEzJzI4LjgiUiA1mcKwMDInMy44Mg!5e0!3m2!1sfr!2scd!4v1',
    image: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&q=80',
    summary: 'Veillée de reconnaissance et d\'intercession pour la nouvelle année.',
    bodyParagraphs: [
      'Une longue soirée de prière pour rendre grâce et déposer devant Dieu les projets de la communauté pour l\'année à venir.',
    ],
    program: [
      { timeRange: '19h00 – 22h00', title: 'Enchaînement de segments de prière et louange' },
      { timeRange: '22h00 – 23h00', title: 'Partage et clôture' },
    ],
    moderators: [
      { name: 'Conseil des anciens', roleTitle: 'Animation collective', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=256&q=80&fit=crop' },
    ],
  },
  {
    slug: 'journee-jeunesse-2025',
    title: 'Journée Jeunesse « Sentiers de foi »',
    dateLabel: '8 novembre 2025',
    startDate: '2025-11-08',
    endDate: '2025-11-08',
    locationShort: 'Salle paroissiale — Goma',
    addressLines: 'Salle paroissiale CELPA Salem\nAvenue de la Victoire, Goma',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249.7!2d29.22!3d-1.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNDAnMTguMk0gMjnCsDEzJzI4LjgiUiA1mcKwMDInMy44Mg!5e0!3m2!1sfr!2scd!4v1',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
    summary: 'Rencontre intergénérationnelle : ateliers, sport et enseignement.',
    bodyParagraphs: [
      'Une journée conviviale pour renforcer les liens entre jeunes et adultes mentors autour d\'ateliers pratiques et d\'un temps biblique.',
    ],
    program: [
      { timeRange: '09h00', title: 'Accueil et petit-déjeuner' },
      { timeRange: '10h00 – 12h00', title: 'Ateliers (créativité, témoignage, discernement)' },
      { timeRange: '14h00 – 16h00', title: 'Enseignement et débat' },
      { timeRange: '16h30', title: 'Célébration brève et photo de groupe' },
    ],
    moderators: [
      { name: 'Équipe Jeunesse Salem', roleTitle: 'Organisation — comité jeunesse', imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=256&q=80&fit=crop' },
      { name: 'Pasteur adjoint Martin P.', roleTitle: 'Enseignant de la session de l\'après-midi' },
    ],
  },
];

const departmentsData = [
  {
    slug: 'choeur-salem',
    parentDepartmentId: null,
    name: 'Chœur Salem',
    description: 'Le chœur Salem accompagne les cultes avec des louanges ferventes, alliant tradition et modernité. Nos choristes se réunissent chaque semaine pour préparer un répertoire enrichissant pour l\'édification de l\'église.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    responsables: [
      { name: 'Frère David L.', roleTitle: 'Chef de chœur', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80&fit=crop', contactEmail: 'david.l@celpasalem.cd', contactPhone: '+243 123 456 789', bio: 'Directeur artistique passionné, il coordonne la vision musicale de la chorale depuis 2018.' },
      { name: 'Sœur Esther B.', roleTitle: 'Assistante — voix solistes', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80&fit=crop', contactEmail: 'esther.b@celpasalem.cd', bio: 'Responsable de la préparation des solistes et de la section soprano.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
    ],
    songs: [
      { id: 'song-1', title: 'Grand est Ton Nom', artist: 'Chœur Salem', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '4:32' },
      { id: 'song-2', title: 'Alléluia, Louez', artist: 'Chœur Salem', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '3:45' },
      { id: 'song-3', title: 'Père Éternel', artist: 'Chœur Salem', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '5:10' },
      { id: 'song-4', title: 'Élevons nos Cœurs', artist: 'Chœur Salem', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '4:18' },
      { id: 'song-5', title: 'Majesté', artist: 'Chœur Salem', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '3:55' },
    ],
    videos: [
      { id: 'vid-1', title: 'Culte du Dimanche - Chœur', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80', publishedAt: '2026-04-27T10:00:00Z' },
      { id: 'vid-2', title: 'Concert de Louange 2026', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80', publishedAt: '2026-04-20T19:00:00Z' },
    ],
    subDepartmentSlugs: ['chorale-jeunes', 'chorale-enfants'],
    eventSlugs: ['concert-de-louange-2026'],
  },
  {
    slug: 'ministere-jeunesse',
    parentDepartmentId: null,
    name: 'Ministère Jeunesse',
    description: 'La jeunesse de CELPA Salem est un espace de croissance spirituelle, d\'amitié et de service. Nous organisons des rencontres, des ateliers et des moments de partage pour les jeunes de 12 à 30 ans.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
    responsables: [
      { name: 'Pasteur adjoint Martin P.', roleTitle: 'Responsable jeunesse', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80&fit=crop', contactEmail: 'martin.p@celpasalem.cd', contactPhone: '+243 987 654 321', bio: 'Dédié à l\'accompagnement spirituel des jeunes et à l\'organisation des activités.' },
      { name: 'Sœur Rachel M.', roleTitle: 'Coordinatrice activités', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&q=80&fit=crop', contactEmail: 'rachel.m@celpasalem.cd', bio: 'Organise les sorties, camps et ateliers pour la jeunesse.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
      'https://images.unsplash.com/photo-1530099482911-007dd2c6e3f6?w=800&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      'https://images.unsplash.com/photo-1511632765486-a019814d59d6?w=800&q=80',
    ],
    videos: [
      { id: 'vid-2-1', title: 'Journée Jeunesse 2025', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80', publishedAt: '2025-11-08T10:00:00Z' },
    ],
    subDepartmentSlugs: ['groupe-ados', 'groupe-jeunes-adultes'],
    eventSlugs: ['journee-jeunesse-2025'],
  },
  {
    slug: 'intercession',
    parentDepartmentId: null,
    name: 'Intercession',
    description: 'L\'équipe d\'intercession porte les besoins de l\'église, des familles et de la nation dans la prière. Des veillées, des temps de jeûne et une veille quotidienne sont organisés.',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80',
    responsables: [
      { name: 'Sœur Grace Kabongo', roleTitle: 'Coordinatrice intercession', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&q=80&fit=crop', contactEmail: 'grace.k@celpasalem.cd', contactPhone: '+243 555 111 222', bio: 'Anime les temps de prière et coordonne les groupes d\'intercession.' },
      { name: 'Diacre Samuel T.', roleTitle: 'Responsable organisation', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80&fit=crop', contactEmail: 'samuel.t@celpasalem.cd', bio: 'Gère la logistique des veillées et la communication des temps de prière.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80',
      'https://images.unsplash.com/photo-1509900666769-6b94a2961c7c?w=800&q=80',
    ],
    videos: [
      { id: 'vid-3-1', title: 'Semaine de Prière 2026', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&q=80', publishedAt: '2026-03-10T18:00:00Z' },
      { id: 'vid-3-2', title: 'Veillée de Fin d\'Année', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=400&q=80', publishedAt: '2025-12-15T21:00:00Z' },
    ],
    subDepartmentSlugs: [],
    eventSlugs: ['semaine-de-priere-2026', 'veillee-de-priere-2025'],
  },
  {
    slug: 'chorale-jeunes',
    parentDepartmentId: 1,
    name: 'Chorale Jeunes',
    description: 'La chorale jeunes réunit les jeunes de 12 à 25 ans pour louer Dieu avec enthousiasme. Un répertoire moderne et dynamique pour inspirer la nouvelle génération.',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1200&q=80',
    responsables: [
      { name: 'Frère Jonathan K.', roleTitle: 'Chef de chorale jeunes', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80&fit=crop', contactEmail: 'jonathan.k@celpasalem.cd', bio: 'Jeune leader passionné par la musique et la louange contemporaine.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    ],
    songs: [
      { id: 'song-j1', title: 'Jeunesse pour Christ', artist: 'Chorale Jeunes', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '3:28' },
      { id: 'song-j2', title: 'Rayonnons', artist: 'Chorale Jeunes', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: '4:05' },
    ],
    videos: [
      { id: 'vid-j1', title: 'Jeunesse pour Christ', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80', publishedAt: '2026-03-15T10:00:00Z' },
      { id: 'vid-j2', title: 'Rayonnons', source: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', publishedAt: '2026-03-01T10:00:00Z' },
    ],
    subDepartmentSlugs: [],
    eventSlugs: ['concert-de-louange-2026'],
  },
  {
    slug: 'chorale-enfants',
    parentDepartmentId: 1,
    name: 'Chorale Enfants',
    description: 'Nos enfants apprennent à louer Dieu avec joie à travers des chants adaptés à leur âge. Une formation musicale et spirituelle dès le plus jeune âge.',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&q=80',
    responsables: [
      { name: 'Sœur Marie K.', roleTitle: 'Directrice chorale enfants', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80&fit=crop', contactEmail: 'marie.k@celpasalem.cd', bio: 'Enseignante dévouée à la formation musicale et spirituelle des enfants.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
      'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=800&q=80',
    ],
    songs: [
      { id: 'song-e1', title: 'Dieu aime les Enfants', artist: 'Chorale Enfants', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: '2:45' },
      { id: 'song-e2', title: 'Louez avec Joie', artist: 'Chorale Enfants', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: '3:10' },
    ],
    videos: [],
    subDepartmentSlugs: [],
    eventSlugs: [],
  },
  {
    slug: 'groupe-ados',
    parentDepartmentId: 2,
    name: 'Groupe Ados',
    description: 'Un espace dédié aux adolescents (12-17 ans) pour grandir dans la foi, partager des défis et s\'épanouir dans un cadre chrétien bienveillant.',
    image: 'https://images.unsplash.com/photo-1530099482911-007dd2c6e3f6?w=1200&q=80',
    responsables: [
      { name: 'Frère Marc L.', roleTitle: 'Responsable ados', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80&fit=crop', contactEmail: 'marc.l@celpasalem.cd', bio: 'Accompagne les ados dans leur parcours spirituel et leurs questionnements.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1530099482911-007dd2c6e3f6?w=800&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    ],
    songs: [],
    videos: [],
    subDepartmentSlugs: [],
    eventSlugs: ['journee-jeunesse-2025'],
  },
  {
    slug: 'groupe-jeunes-adultes',
    parentDepartmentId: 2,
    name: 'Jeunes Adultes',
    description: 'Les jeunes adultes (23-35 ans) se retrouvent pour des études bibliques, des discussions et des projets de service communautaire.',
    image: 'https://images.unsplash.com/photo-1511632765486-a019814d59d6?w=1200&q=80',
    responsables: [
      { name: 'Sœur Sarah N.', roleTitle: 'Coordinatrice jeunes adultes', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&q=80&fit=crop', contactEmail: 'sarah.n@celpasalem.cd', bio: 'Facilite les discussions et l\'entraide entre jeunes adultes.' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1511632765486-a019814d59d6?w=800&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    ],
    songs: [],
    videos: [],
    subDepartmentSlugs: [],
    eventSlugs: ['journee-jeunesse-2025'],
  },
];

type FieldSeedDef = {
  fieldKey: string;
  fieldType: ContentFieldType;
  label: string;
  required: boolean;
  sortOrder: number;
  validation?: Record<string, unknown> | null;
};

const churchEventFieldDefinitions = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Title', required: true, sortOrder: 1 },
  { fieldKey: 'slug', fieldType: ContentFieldType.TEXT, label: 'Slug', required: true, sortOrder: 2 },
  { fieldKey: 'dateLabel', fieldType: ContentFieldType.TEXT, label: 'Date Label', required: true, sortOrder: 3 },
  { fieldKey: 'startDate', fieldType: ContentFieldType.DATE, label: 'Start Date', required: true, sortOrder: 4 },
  { fieldKey: 'endDate', fieldType: ContentFieldType.DATE, label: 'End Date', required: false, sortOrder: 5 },
  { fieldKey: 'locationShort', fieldType: ContentFieldType.TEXT, label: 'Location Short', required: true, sortOrder: 6 },
  { fieldKey: 'addressLines', fieldType: ContentFieldType.TEXTAREA, label: 'Address Lines', required: false, sortOrder: 7 },
  { fieldKey: 'mapEmbedUrl', fieldType: ContentFieldType.TEXT, label: 'Map Embed URL', required: false, sortOrder: 8 },
  { fieldKey: 'image', fieldType: ContentFieldType.IMAGE, label: 'Image', required: true, sortOrder: 9 },
  { fieldKey: 'summary', fieldType: ContentFieldType.TEXTAREA, label: 'Summary', required: true, sortOrder: 10 },
  { fieldKey: 'bodyParagraphs', fieldType: ContentFieldType.TEXTAREA, label: 'Body Paragraphs', required: false, sortOrder: 11 },
  { fieldKey: 'program', fieldType: ContentFieldType.HTML, label: 'Program', required: false, sortOrder: 12 },
  { fieldKey: 'moderators', fieldType: ContentFieldType.HTML, label: 'Moderators', required: false, sortOrder: 13 },
];

const departmentPageFieldDefinitions = [
  { fieldKey: 'name', fieldType: ContentFieldType.TEXT, label: 'Name', required: true, sortOrder: 1 },
  { fieldKey: 'slug', fieldType: ContentFieldType.TEXT, label: 'Slug', required: true, sortOrder: 2 },
  {
    fieldKey: 'parentDepartmentId',
    fieldType: ContentFieldType.NUMBER,
    label: 'Parent department (linkedEntityId)',
    required: false,
    sortOrder: 3,
  },
  {
    fieldKey: 'rbacDepartmentId',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Département (RBAC)',
    required: false,
    sortOrder: 4,
    validation: { targetLinkedEntityType: 'Department', multiple: false },
  },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: true, sortOrder: 5 },
  { fieldKey: 'image', fieldType: ContentFieldType.IMAGE, label: 'Image', required: true, sortOrder: 6 },
  { fieldKey: 'responsables', fieldType: ContentFieldType.PROFILE_LIST, label: 'Responsables', required: false, sortOrder: 7 },
  { fieldKey: 'gallery', fieldType: ContentFieldType.IMAGES, label: 'Gallery', required: false, sortOrder: 8 },
  {
    fieldKey: 'songs',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Songs',
    required: false,
    sortOrder: 9,
    validation: { targetLinkedEntityType: 'Song', multiple: true },
  },
  {
    fieldKey: 'videos',
    fieldType: ContentFieldType.VIDEO_LIST,
    label: 'Videos',
    required: false,
    sortOrder: 10,
  },
  { fieldKey: 'subDepartmentSlugs', fieldType: ContentFieldType.TEXT, label: 'Sub Department Slugs', required: false, sortOrder: 11 },
  { fieldKey: 'eventSlugs', fieldType: ContentFieldType.TEXT, label: 'Event Slugs', required: false, sortOrder: 12 },
];

const churchSiteProfileFieldDefinitions = [
  { fieldKey: 'churchName', fieldType: ContentFieldType.TEXT, label: 'Church name', required: true, sortOrder: 1 },
  { fieldKey: 'tagline', fieldType: ContentFieldType.TEXT, label: 'Tagline', required: false, sortOrder: 2 },
  { fieldKey: 'aboutHtml', fieldType: ContentFieldType.HTML, label: 'About', required: false, sortOrder: 3 },
  { fieldKey: 'address', fieldType: ContentFieldType.TEXTAREA, label: 'Address', required: false, sortOrder: 4 },
  { fieldKey: 'serviceTimesHtml', fieldType: ContentFieldType.HTML, label: 'Service times', required: false, sortOrder: 5 },
  { fieldKey: 'contactEmail', fieldType: ContentFieldType.TEXT, label: 'Contact email', required: false, sortOrder: 6 },
  { fieldKey: 'contactPhone', fieldType: ContentFieldType.TEXT, label: 'Contact phone', required: false, sortOrder: 7 },
  { fieldKey: 'socialLinks', fieldType: ContentFieldType.HTML, label: 'Social links (JSON array)', required: false, sortOrder: 8 },
  { fieldKey: 'heroImage', fieldType: ContentFieldType.IMAGE, label: 'Hero image URL', required: false, sortOrder: 9 },
  { fieldKey: 'seoDefaults', fieldType: ContentFieldType.HTML, label: 'SEO defaults (JSON)', required: false, sortOrder: 10 },
];

const donationSettingsFieldDefinitions = [
  { fieldKey: 'headline', fieldType: ContentFieldType.TEXT, label: 'Headline', required: true, sortOrder: 1 },
  { fieldKey: 'bodyHtml', fieldType: ContentFieldType.HTML, label: 'Body', required: false, sortOrder: 2 },
  { fieldKey: 'methods', fieldType: ContentFieldType.HTML, label: 'Methods (JSON array)', required: false, sortOrder: 3 },
  { fieldKey: 'legalNoticeHtml', fieldType: ContentFieldType.HTML, label: 'Legal notice', required: false, sortOrder: 4 },
  { fieldKey: 'receiptContact', fieldType: ContentFieldType.TEXT, label: 'Receipt contact', required: false, sortOrder: 5 },
];

const albumFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Title', required: true, sortOrder: 1 },
  { fieldKey: 'slug', fieldType: ContentFieldType.TEXT, label: 'Slug', required: true, sortOrder: 2 },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: false, sortOrder: 3 },
  { fieldKey: 'coverImage', fieldType: ContentFieldType.IMAGE, label: 'Cover image', required: false, sortOrder: 4 },
  {
    fieldKey: 'songs',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Songs',
    required: false,
    sortOrder: 5,
    validation: { targetLinkedEntityType: 'Song', multiple: true },
  },
];

const playlistFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Title', required: true, sortOrder: 1 },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: false, sortOrder: 2 },
  { fieldKey: 'composers', fieldType: ContentFieldType.TEXTAREA, label: 'Composers', required: false, sortOrder: 3 },
  {
    fieldKey: 'participants',
    fieldType: ContentFieldType.PROFILE_LIST,
    label: 'Participants',
    required: false,
    sortOrder: 4,
  },
  { fieldKey: 'audio_url', fieldType: ContentFieldType.TEXT, label: 'Audio URL', required: false, sortOrder: 5 },
  { fieldKey: 'video_url', fieldType: ContentFieldType.TEXT, label: 'Video URL', required: false, sortOrder: 6 },
  {
    fieldKey: 'album',
    fieldType: ContentFieldType.RELATION,
    label: 'Album',
    required: false,
    sortOrder: 7,
    validation: { targetContentTypeCode: 'Album', multiple: false },
  },
  {
    fieldKey: 'songs',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Songs',
    required: false,
    sortOrder: 8,
    validation: { targetLinkedEntityType: 'Song', multiple: true },
  },
];

const churchSiteProfileData = {
  churchName: '5ème CELPA Salem',
  tagline: 'Un lieu de paix. Une marche de foi.',
  aboutHtml:
    '<p>Nous sommes une communauté réformée qui cherche à glorifier Dieu dans la Parole, la louange et le service.</p>',
  address: 'Kinshasa — République Démocratique du Congo',
  serviceTimesHtml: '<p>Culte dominical : 10h00. Étude biblique : mercredi 18h30.</p>',
  contactEmail: 'contact@celpasalem.cd',
  contactPhone: '+243 XXX XXX XXX',
  socialLinks: [
    { label: 'Facebook', url: 'https://facebook.com' },
    { label: 'YouTube', url: 'https://youtube.com' },
  ],
  heroImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1600&q=80',
  seoDefaults: {
    title: 'CELPA Salem — Accueil',
    description: 'Église réformée — louange, Parole et communauté.',
    ogImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80',
  },
};

const donationSettingsData = {
  headline: 'Soutenir la mission',
  bodyHtml:
    '<p>Vos dons permettent d’œuvrer pour l’évangile, la diaconie et la formation. Merci pour votre générosité.</p>',
  methods: [
    { type: 'bank', label: 'Virement bancaire', details: 'Banque X — IBAN: CD00 0000 0000 0000 0000 0000 — Réf: DON-SALEM' },
    { type: 'mobile', label: 'Mobile money', details: 'Numéro dédié communiqué au bureau.' },
  ],
  legalNoticeHtml: '<p class="text-sm opacity-80">Les dons sont utilisés conformément aux statuts de l’église.</p>',
  receiptContact: 'tresorier@celpasalem.cd',
};

export async function seedContent(dataSource: DataSource): Promise<void> {
  const typeRepo = dataSource.getRepository(ContentType);
  const fieldRepo = dataSource.getRepository(ContentFieldDefinition);
  const contentRepo = dataSource.getRepository(Content);

  console.log('🌱 Starting content seed (idempotent)...');

  async function ensureContentType(data: {
    name: string;
    code: string;
    description: string | null;
    allowedLinkedEntityTypes: string[];
  }): Promise<ContentType> {
    let t = await typeRepo.findOne({ where: { code: data.code } });
    if (!t) {
      t = typeRepo.create({
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: true,
        allowedLinkedEntityTypes: data.allowedLinkedEntityTypes,
      });
      await typeRepo.save(t);
      console.log(`✅ Created content type: ${data.code}`);
    } else {
      t.name = data.name;
      t.description = data.description;
      t.allowedLinkedEntityTypes = data.allowedLinkedEntityTypes;
      t.isActive = true;
      await typeRepo.save(t);
      console.log(`↻ Updated content type: ${data.code}`);
    }
    return t;
  }

  async function ensureFieldDefs(
    contentType: ContentType,
    defs: FieldSeedDef[],
  ): Promise<void> {
    for (const fieldDef of defs) {
      let f = await fieldRepo.findOne({
        where: { contentType: { id: contentType.id }, fieldKey: fieldDef.fieldKey },
        relations: ['contentType'],
      });
      if (!f) {
        f = fieldRepo.create({
          contentType,
          fieldKey: fieldDef.fieldKey,
          fieldType: fieldDef.fieldType,
          label: fieldDef.label,
          required: fieldDef.required,
          sortOrder: fieldDef.sortOrder,
          validation:
            fieldDef.validation !== undefined ? fieldDef.validation : null,
        });
        await fieldRepo.save(f);
      } else {
        f.fieldType = fieldDef.fieldType;
        f.label = fieldDef.label;
        f.required = fieldDef.required;
        f.sortOrder = fieldDef.sortOrder;
        if (fieldDef.validation !== undefined) {
          f.validation = fieldDef.validation;
        }
        await fieldRepo.save(f);
      }
    }
  }

  async function upsertPublishedContent(
    contentType: ContentType,
    linkedEntityType: string,
    linkedEntityId: number,
    fieldValues: Record<string, unknown>,
  ): Promise<number> {
    let row = await contentRepo.findOne({
      where: {
        contentType: { id: contentType.id },
        linkedEntityType,
        linkedEntityId,
      },
      relations: ['contentType'],
    });
    if (!row) {
      row = contentRepo.create({
        contentType,
        linkedEntityType,
        linkedEntityId,
        fieldValues,
        status: ContentStatus.PUBLISHED,
        visibility: ContentVisibility.PUBLIC,
        publishedAt: new Date(),
      });
    } else {
      row.fieldValues = fieldValues;
      row.status = ContentStatus.PUBLISHED;
      row.visibility = ContentVisibility.PUBLIC;
      row.publishedAt = row.publishedAt ?? new Date();
    }
    const saved = await contentRepo.save(row);
    return saved.id;
  }

  async function ensureAlbumStub(id: number, label: string): Promise<void> {
    await dataSource.query(
      `INSERT INTO albums (id, label) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label`,
      [id, label],
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('albums', 'id'), COALESCE((SELECT MAX(id) FROM albums), 1))`,
    );
  }

  async function ensurePlaylistStub(id: number, label: string): Promise<void> {
    await dataSource.query(
      `INSERT INTO playlists (id, label) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label`,
      [id, label],
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('playlists', 'id'), COALESCE((SELECT MAX(id) FROM playlists), 1))`,
    );
  }

  const churchEventType = await ensureContentType({
    name: 'ChurchEvent',
    code: 'ChurchEvent',
    description: 'Church event with program, moderators, and location details',
    allowedLinkedEntityTypes: ['Event'],
  });
  await ensureFieldDefs(churchEventType, churchEventFieldDefinitions);

  const departmentPageType = await ensureContentType({
    name: 'DepartmentPage',
    code: 'DepartmentPage',
    description: 'Department page with description, gallery, songs, and videos',
    allowedLinkedEntityTypes: ['DepartmentPage'],
  });
  await ensureFieldDefs(departmentPageType, departmentPageFieldDefinitions);

  const churchSiteType = await ensureContentType({
    name: 'ChurchSiteProfile',
    code: 'ChurchSiteProfile',
    description: 'Public church / website profile singleton',
    allowedLinkedEntityTypes: ['SiteProfile'],
  });
  await ensureFieldDefs(churchSiteType, churchSiteProfileFieldDefinitions);

  const donationType = await ensureContentType({
    name: 'DonationSettings',
    code: 'DonationSettings',
    description: 'Public donation copy and methods singleton',
    allowedLinkedEntityTypes: ['DonationSettings'],
  });
  await ensureFieldDefs(donationType, donationSettingsFieldDefinitions);

  const albumType = await ensureContentType({
    name: 'Album',
    code: 'Album',
    description: 'Album musical / compilation référencée par les playlists',
    allowedLinkedEntityTypes: ['Album'],
  });
  await ensureFieldDefs(albumType, albumFieldDefinitions);

  const playlistType = await ensureContentType({
    name: 'Playlist',
    code: 'Playlist',
    description: 'Liste de lecture avec participants et lien album optionnel',
    allowedLinkedEntityTypes: ['Playlist'],
  });
  await ensureFieldDefs(playlistType, playlistFieldDefinitions);

  await ensureAlbumStub(1, 'Album lien #1');
  const sampleAlbumContentId = await upsertPublishedContent(
    albumType,
    'Album',
    1,
    {
      title: 'Louange — Récolte 2025',
      slug: 'louange-recolte-2025',
      description:
        'Compilation des chants mis en avant lors des cultes de louange.',
      coverImage:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    },
  );

  console.log('✅ Upserted sample album content');

  for (let i = 0; i < churchEventsData.length; i++) {
    await upsertPublishedContent(churchEventType, 'Event', i + 1, churchEventsData[i] as unknown as Record<string, unknown>);
  }
  console.log(`✅ Upserted ${churchEventsData.length} church events`);

  const songRepo = dataSource.getRepository(Song);

  const rbacDeptByCode = new Map<string, number>();

  async function ensureRbacDepartment(
    code: string,
    name: string,
    parentCode?: string,
  ): Promise<number> {
    const existing: { id: number }[] = await dataSource.query(
      `SELECT id FROM departments WHERE code = $1 LIMIT 1`,
      [code],
    );
    if (existing[0]?.id) {
      rbacDeptByCode.set(code, Number(existing[0].id));
      return Number(existing[0].id);
    }
    const parentId = parentCode
      ? (rbacDeptByCode.get(parentCode) ?? null)
      : null;
    const inserted: { id: number }[] = await dataSource.query(
      `INSERT INTO departments (name, code, description, "isActive", "parentDepartmentId")
       VALUES ($1, $2, $3, true, $4)
       RETURNING id`,
      [name, code, null, parentId],
    );
    const id = Number(inserted[0].id);
    rbacDeptByCode.set(code, id);
    return id;
  }

  await ensureRbacDepartment('choeur-salem', 'Chœur Salem');
  await ensureRbacDepartment('ministere-jeunesse', 'Ministère Jeunesse');
  await ensureRbacDepartment('intercession', 'Intercession');
  await ensureRbacDepartment('chorale-jeunes', 'Chorale Jeunes', 'choeur-salem');
  await ensureRbacDepartment('chorale-enfants', 'Chorale Enfants', 'choeur-salem');
  await ensureRbacDepartment('groupe-ados', 'Groupe Ados', 'ministere-jeunesse');
  await ensureRbacDepartment(
    'groupe-jeunes-adultes',
    'Jeunes Adultes',
    'ministere-jeunesse',
  );

  const seedSongIdByLegacyKey = new Map<string, number>();

  async function upsertSeedSong(
    inline: InlineSeedSong,
    departmentId: number | null,
    albumId: number | null = null,
  ): Promise<number> {
    const cached = seedSongIdByLegacyKey.get(inline.id);
    if (cached) return cached;

    let row = await songRepo.findOne({
      where: { title: inline.title, composer: inline.artist },
    });
    if (!row) {
      row = songRepo.create({
        title: inline.title,
        composer: inline.artist,
        genre: 'Louange',
        difficulty: SongDifficulty.EASY,
        status: SongStatus.ACTIVE,
        lyrics: '',
        audioUrl: inline.audioUrl,
        duration: inline.duration,
        departmentId,
        albumId,
        times_performed: 0,
        addedById: null,
      });
      row = await songRepo.save(row);
    } else {
      row.audioUrl = inline.audioUrl;
      row.duration = inline.duration;
      if (departmentId != null) row.departmentId = departmentId;
      if (albumId != null) row.albumId = albumId;
      row = await songRepo.save(row);
    }
    seedSongIdByLegacyKey.set(inline.id, row.id);
    return row.id;
  }

  const allSeedSongIds: number[] = [];

  for (let i = 0; i < departmentsData.length; i++) {
    const raw = departmentsData[i] as Record<string, unknown>;
    const slug = String(raw.slug ?? '');
    const rbacDepartmentId = rbacDeptByCode.get(slug) ?? null;
    const inlineSongs = Array.isArray(raw.songs)
      ? (raw.songs as InlineSeedSong[])
      : [];
    const songIds: number[] = [];
    for (const s of inlineSongs) {
      const id = await upsertSeedSong(s, rbacDepartmentId);
      songIds.push(id);
      allSeedSongIds.push(id);
    }

    const { songs: _songs, ...rest } = raw;
    await upsertPublishedContent(departmentPageType, 'DepartmentPage', i + 1, {
      ...rest,
      rbacDepartmentId,
      songs: songIds,
    });
  }
  console.log(`✅ Upserted ${departmentsData.length} department pages with linked songs`);

  const playlistSongIds = allSeedSongIds.slice(0, 5);
  await ensurePlaylistStub(1, 'Playlist lien #1');
  await upsertPublishedContent(playlistType, 'Playlist', 1, {
    title: 'Dimanche — Set principal',
    description: 'Ordre de cantiques proposé pour le culte.',
    composers: 'Collectif Salem\nArrangements : Frère David L.',
    participants: [
      {
        name: 'Sœur Esther B.',
        roleTitle: 'Chef de chœur',
        imageUrl: '',
      },
      {
        name: 'Frère Marc L.',
        roleTitle: 'Clavier',
        imageUrl: '',
      },
    ],
    audio_url: '',
    video_url: '',
    album: sampleAlbumContentId,
    songs: playlistSongIds,
  });
  console.log('✅ Upserted sample playlist with linked songs');

  await upsertPublishedContent(albumType, 'Album', 1, {
    title: 'Louange — Récolte 2025',
    slug: 'louange-recolte-2025',
    description:
      'Compilation des chants mis en avant lors des cultes de louange.',
    coverImage:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    songs: playlistSongIds,
  });

  await upsertPublishedContent(churchSiteType, 'SiteProfile', 1, churchSiteProfileData);
  console.log('✅ Upserted church site profile');

  await upsertPublishedContent(donationType, 'DonationSettings', 1, donationSettingsData);
  console.log('✅ Upserted donation settings');

  console.log('🌱 Content seed completed!');
}