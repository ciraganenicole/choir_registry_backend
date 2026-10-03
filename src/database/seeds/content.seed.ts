import { DataSource } from 'typeorm';
import { ContentType } from '../../modules/content/content-type.entity';
import { ContentFieldDefinition } from '../../modules/content/content-field-definition.entity';
import { Content } from '../../modules/content/content.entity';
import { ContentFieldType } from '../../modules/content/enums/content-field-type.enum';
import { ContentStatus } from '../../modules/content/enums/content-status.enum';
import { ContentVisibility } from '../../modules/content/enums/content-visibility.enum';
import { slugify } from '../../modules/content/content-slug.util';
import {
  Song,
  SongDifficulty,
  SongStatus,
} from '../../modules/song/song.entity';

function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join('');
}

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
    eventSlugs: ['journee-jeunesse-2025'],
  },
];

type FieldSeedDef = {
  fieldKey: string;
  fieldType: ContentFieldType;
  label: string;
  required: boolean;
  sortOrder: number;
  showInTable?: boolean;
  validation?: Record<string, unknown> | null;
};

/**
 * Optional notification (call to action) fields shared by teachings, events and
 * community updates. When `notify` is enabled the entry is surfaced in the
 * public notification center via `GET /public/content/notifications`.
 */
const notificationFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'notify', fieldType: ContentFieldType.BOOLEAN, label: 'Afficher une notification', required: false, sortOrder: 50 },
  { fieldKey: 'notificationTitle', fieldType: ContentFieldType.TEXT, label: 'Notification — titre', required: false, sortOrder: 51 },
  { fieldKey: 'notificationMessage', fieldType: ContentFieldType.TEXTAREA, label: 'Notification — message', required: false, sortOrder: 52 },
  { fieldKey: 'notificationCtaLabel', fieldType: ContentFieldType.TEXT, label: 'Notification — libellé du bouton', required: false, sortOrder: 53 },
  { fieldKey: 'notificationCtaHref', fieldType: ContentFieldType.TEXT, label: 'Notification — lien du bouton', required: false, sortOrder: 54 },
  { fieldKey: 'notificationTag', fieldType: ContentFieldType.TEXT, label: 'Notification — catégorie', required: false, sortOrder: 55 },
];

const churchEventFieldDefinitions = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1 },
  { fieldKey: 'dateLabel', fieldType: ContentFieldType.TEXT, label: 'Libellé de date', required: true, sortOrder: 2 },
  { fieldKey: 'startDate', fieldType: ContentFieldType.DATE, label: 'Date de début', required: true, sortOrder: 3 },
  { fieldKey: 'endDate', fieldType: ContentFieldType.DATE, label: 'Date de fin', required: false, sortOrder: 4 },
  { fieldKey: 'locationShort', fieldType: ContentFieldType.TEXT, label: 'Lieu (court)', required: true, sortOrder: 5 },
  { fieldKey: 'addressLines', fieldType: ContentFieldType.TEXTAREA, label: 'Adresse', required: false, sortOrder: 6 },
  { fieldKey: 'mapEmbedUrl', fieldType: ContentFieldType.TEXT, label: 'URL de la carte', required: false, sortOrder: 7 },
  { fieldKey: 'image', fieldType: ContentFieldType.IMAGE, label: 'Image', required: true, sortOrder: 8 },
  { fieldKey: 'summary', fieldType: ContentFieldType.TEXTAREA, label: 'Résumé', required: true, sortOrder: 9 },
  { fieldKey: 'bodyHtml', fieldType: ContentFieldType.HTML, label: "Corps de l'événement", required: false, sortOrder: 10 },
  { fieldKey: 'program', fieldType: ContentFieldType.PROGRAM_LIST, label: 'Programme', required: false, sortOrder: 11 },
  { fieldKey: 'moderators', fieldType: ContentFieldType.MODERATOR_LIST, label: 'Intervenants', required: false, sortOrder: 12 },
  ...notificationFieldDefinitions,
];

const departmentPageFieldDefinitions = [
  { fieldKey: 'name', fieldType: ContentFieldType.TEXT, label: 'Nom', required: true, sortOrder: 1 },
  {
    fieldKey: 'parentDepartmentId',
    fieldType: ContentFieldType.RELATION,
    label: 'Département parent',
    required: false,
    sortOrder: 2,
    validation: {
      targetContentTypeCode: 'DepartmentPage',
      multiple: false,
      storeAs: 'linkedEntityId',
    },
  },
  {
    fieldKey: 'rbacDepartmentId',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Département interne (permissions)',
    required: false,
    sortOrder: 3,
    validation: { targetLinkedEntityType: 'Department', multiple: false },
  },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: true, sortOrder: 4 },
  { fieldKey: 'image', fieldType: ContentFieldType.IMAGE, label: 'Image', required: true, sortOrder: 5 },
  { fieldKey: 'responsables', fieldType: ContentFieldType.PROFILE_LIST, label: 'Responsables', required: false, sortOrder: 6 },
  { fieldKey: 'gallery', fieldType: ContentFieldType.IMAGES, label: 'Galerie', required: false, sortOrder: 7 },
  {
    fieldKey: 'songs',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Chants',
    required: false,
    sortOrder: 8,
    validation: { targetLinkedEntityType: 'Song', multiple: true },
  },
  {
    fieldKey: 'videos',
    fieldType: ContentFieldType.VIDEO_LIST,
    label: 'Vidéos',
    required: false,
    sortOrder: 9,
  },
  {
    fieldKey: 'eventSlugs',
    fieldType: ContentFieldType.RELATION,
    label: 'Événements liés',
    required: false,
    sortOrder: 10,
    validation: {
      targetContentTypeCode: 'ChurchEvent',
      multiple: true,
      storeAs: 'slug',
    },
  },
];

const churchSiteProfileFieldDefinitions = [
  { fieldKey: 'churchName', fieldType: ContentFieldType.TEXT, label: "Nom de l'église", required: true, sortOrder: 1 },
  { fieldKey: 'tagline', fieldType: ContentFieldType.TEXT, label: 'Accroche', required: false, sortOrder: 2 },
  { fieldKey: 'aboutHtml', fieldType: ContentFieldType.HTML, label: 'À propos', required: false, sortOrder: 3 },
  { fieldKey: 'address', fieldType: ContentFieldType.TEXTAREA, label: 'Adresse', required: false, sortOrder: 4 },
  { fieldKey: 'serviceTimesHtml', fieldType: ContentFieldType.HTML, label: 'Horaires des cultes', required: false, sortOrder: 5 },
  { fieldKey: 'contactEmail', fieldType: ContentFieldType.TEXT, label: 'E-mail de contact', required: false, sortOrder: 6 },
  { fieldKey: 'contactPhone', fieldType: ContentFieldType.TEXT, label: 'Téléphone de contact', required: false, sortOrder: 7 },
  { fieldKey: 'socialLinks', fieldType: ContentFieldType.SOCIAL_LINK_LIST, label: 'Liens sociaux', required: false, sortOrder: 8 },
  { fieldKey: 'heroImage', fieldType: ContentFieldType.IMAGE, label: "Image d'accueil", required: false, sortOrder: 9 },
  {
    fieldKey: 'programsHeadline',
    fieldType: ContentFieldType.TEXT,
    label: 'Programmes — titre de section',
    required: false,
    sortOrder: 10,
  },
  {
    fieldKey: 'programsIntro',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Programmes — introduction',
    required: false,
    sortOrder: 11,
  },
  {
    fieldKey: 'weeklyPrograms',
    fieldType: ContentFieldType.WEEKLY_PROGRAM_LIST,
    label: 'Programmes — horaires hebdomadaires',
    required: false,
    sortOrder: 12,
  },
  {
    fieldKey: 'recurringPrograms',
    fieldType: ContentFieldType.RECURRING_PROGRAM_LIST,
    label: 'Programmes principaux (modèle hebdomadaire)',
    required: false,
    sortOrder: 13,
  },
  {
    fieldKey: 'contactHeadline',
    fieldType: ContentFieldType.TEXT,
    label: 'Contact — titre de section',
    required: false,
    sortOrder: 15,
  },
  {
    fieldKey: 'contactIntro',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Contact — introduction',
    required: false,
    sortOrder: 16,
  },
  {
    fieldKey: 'mapEmbedUrl',
    fieldType: ContentFieldType.TEXT,
    label: 'Contact — URL iframe carte',
    required: false,
    sortOrder: 17,
  },
  {
    fieldKey: 'homeCellsIntro',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Contact — texte cellules de maison',
    required: false,
    sortOrder: 18,
  },
  {
    fieldKey: 'homeCells',
    fieldType: ContentFieldType.STRING_LIST,
    label: 'Contact — noms des cellules',
    required: false,
    sortOrder: 19,
  },
  {
    fieldKey: 'seoDefaults',
    fieldType: ContentFieldType.SEO_DEFAULTS,
    label: "SEO (accueil) — titre, description, image, mots-clés",
    required: false,
    sortOrder: 20,
  },
  {
    fieldKey: 'pastorQuote',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Pasteur — citation',
    required: false,
    sortOrder: 21,
  },
  {
    fieldKey: 'pastorMessage',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Pasteur — message',
    required: false,
    sortOrder: 22,
  },
  {
    fieldKey: 'pastorName',
    fieldType: ContentFieldType.TEXT,
    label: 'Pasteur — nom',
    required: false,
    sortOrder: 23,
  },
  {
    fieldKey: 'pastorRole',
    fieldType: ContentFieldType.TEXT,
    label: 'Pasteur — rôle',
    required: false,
    sortOrder: 24,
  },
  {
    fieldKey: 'visionTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Vision — titre',
    required: false,
    sortOrder: 25,
  },
  {
    fieldKey: 'visionSummary',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Vision — résumé',
    required: false,
    sortOrder: 26,
  },
  {
    fieldKey: 'visionParagraphs',
    fieldType: ContentFieldType.STRING_LIST,
    label: 'Vision — paragraphes',
    required: false,
    sortOrder: 27,
  },
  {
    fieldKey: 'departmentsIntroTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Départements (page) — titre',
    required: false,
    sortOrder: 28,
  },
  {
    fieldKey: 'departmentsIntroSummary',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Départements (page) — résumé',
    required: false,
    sortOrder: 29,
  },
  {
    fieldKey: 'departmentsIntroParagraphs',
    fieldType: ContentFieldType.STRING_LIST,
    label: 'Départements (page) — paragraphes',
    required: false,
    sortOrder: 30,
  },
  {
    fieldKey: 'responsablesTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Responsables — titre',
    required: false,
    sortOrder: 31,
  },
  {
    fieldKey: 'responsablesSummary',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Responsables — résumé',
    required: false,
    sortOrder: 32,
  },
  {
    fieldKey: 'responsablesParagraphs',
    fieldType: ContentFieldType.STRING_LIST,
    label: 'Responsables — paragraphes',
    required: false,
    sortOrder: 33,
  },
  {
    fieldKey: 'churchLeaders',
    fieldType: ContentFieldType.PROFILE_LIST,
    label: 'Responsables — dirigeants',
    required: false,
    sortOrder: 34,
  },
  {
    fieldKey: 'historyTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Histoire — titre',
    required: false,
    sortOrder: 35,
  },
  {
    fieldKey: 'historySummary',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Histoire — résumé',
    required: false,
    sortOrder: 36,
  },
  {
    fieldKey: 'historyParagraphs',
    fieldType: ContentFieldType.STRING_LIST,
    label: 'Histoire — paragraphes',
    required: false,
    sortOrder: 37,
  },
  {
    fieldKey: 'galleryEyebrow',
    fieldType: ContentFieldType.TEXT,
    label: 'La vie à Salem — surtitre',
    required: false,
    sortOrder: 38,
  },
  {
    fieldKey: 'galleryTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'La vie à Salem — titre',
    required: false,
    sortOrder: 39,
  },
  {
    fieldKey: 'galleryItems',
    fieldType: ContentFieldType.GALLERY_ITEM_LIST,
    label: 'La vie à Salem — galerie',
    required: false,
    sortOrder: 40,
  },
  {
    fieldKey: 'communityEyebrow',
    fieldType: ContentFieldType.TEXT,
    label: 'Communauté — surtitre',
    required: false,
    sortOrder: 41,
  },
  {
    fieldKey: 'communityTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Communauté — titre',
    required: false,
    sortOrder: 42,
  },
  {
    fieldKey: 'communityIntro',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Communauté — introduction',
    required: false,
    sortOrder: 43,
  },
  {
    fieldKey: 'liveChannelUrl',
    fieldType: ContentFieldType.TEXT,
    label: 'Live — URL de la chaîne',
    required: false,
    sortOrder: 44,
  },
  {
    fieldKey: 'livePageTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Live — titre de la page',
    required: false,
    sortOrder: 45,
  },
  {
    fieldKey: 'visitEyebrow',
    fieldType: ContentFieldType.TEXT,
    label: 'Première visite — surtitre',
    required: false,
    sortOrder: 46,
  },
  {
    fieldKey: 'visitTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Première visite — titre',
    required: false,
    sortOrder: 47,
  },
  {
    fieldKey: 'visitBody',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Première visite — texte',
    required: false,
    sortOrder: 48,
  },
  {
    fieldKey: 'visitCtaLabel',
    fieldType: ContentFieldType.TEXT,
    label: 'Première visite — libellé du bouton',
    required: false,
    sortOrder: 49,
  },
  {
    fieldKey: 'visitCtaHref',
    fieldType: ContentFieldType.TEXT,
    label: 'Première visite — lien du bouton',
    required: false,
    sortOrder: 50,
  },
];

const donationSettingsFieldDefinitions = [
  { fieldKey: 'headline', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1 },
  { fieldKey: 'bodyHtml', fieldType: ContentFieldType.HTML, label: 'Corps', required: false, sortOrder: 2 },
  {
    fieldKey: 'methods',
    fieldType: ContentFieldType.HTML,
    label: 'Moyens de don (JSON)',
    required: false,
    sortOrder: 3,
  },
  { fieldKey: 'legalNoticeHtml', fieldType: ContentFieldType.HTML, label: 'Mentions légales', required: false, sortOrder: 4 },
  { fieldKey: 'receiptContact', fieldType: ContentFieldType.TEXT, label: 'Contact pour reçu', required: false, sortOrder: 5 },
  {
    fieldKey: 'spotlightEyebrow',
    fieldType: ContentFieldType.TEXT,
    label: 'Spotlight collecte — surtitre',
    required: false,
    sortOrder: 6,
  },
  {
    fieldKey: 'spotlightTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'Spotlight collecte — titre',
    required: false,
    sortOrder: 7,
  },
  {
    fieldKey: 'spotlightDescription',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Spotlight collecte — description',
    required: false,
    sortOrder: 8,
  },
  {
    fieldKey: 'spotlightPhase',
    fieldType: ContentFieldType.TEXT,
    label: 'Spotlight collecte — phase',
    required: false,
    sortOrder: 9,
  },
  {
    fieldKey: 'spotlightPercent',
    fieldType: ContentFieldType.NUMBER,
    label: 'Spotlight collecte — progression (%)',
    required: false,
    sortOrder: 10,
  },
  {
    fieldKey: 'spotlightImage',
    fieldType: ContentFieldType.IMAGE,
    label: 'Spotlight collecte — image',
    required: false,
    sortOrder: 11,
  },
];

const communityUpdateFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1, showInTable: true },
  { fieldKey: 'meta', fieldType: ContentFieldType.TEXT, label: 'Surtitre', required: false, sortOrder: 2 },
  { fieldKey: 'tone', fieldType: ContentFieldType.TEXT, label: 'Tonalité (green | orange)', required: false, sortOrder: 3 },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: false, sortOrder: 4 },
  { fieldKey: 'ctaLabel', fieldType: ContentFieldType.TEXT, label: 'Libellé du bouton', required: false, sortOrder: 5 },
  { fieldKey: 'ctaVariant', fieldType: ContentFieldType.TEXT, label: 'Style du bouton', required: false, sortOrder: 6 },
  { fieldKey: 'href', fieldType: ContentFieldType.TEXT, label: 'Lien', required: false, sortOrder: 7 },
  { fieldKey: 'displayOrder', fieldType: ContentFieldType.NUMBER, label: 'Ordre d’affichage', required: false, sortOrder: 8 },
  ...notificationFieldDefinitions,
];

const liveEventFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1, showInTable: true },
  { fieldKey: 'videoId', fieldType: ContentFieldType.TEXT, label: 'Identifiant YouTube', required: true, sortOrder: 2 },
  { fieldKey: 'thumbnail', fieldType: ContentFieldType.IMAGE, label: 'Miniature', required: false, sortOrder: 3 },
  { fieldKey: 'publishedAt', fieldType: ContentFieldType.DATE, label: 'Date de publication', required: false, sortOrder: 4 },
  { fieldKey: 'startSeconds', fieldType: ContentFieldType.NUMBER, label: 'Démarrage (secondes)', required: false, sortOrder: 5 },
  { fieldKey: 'displayOrder', fieldType: ContentFieldType.NUMBER, label: 'Ordre d’affichage', required: false, sortOrder: 6 },
];

const albumFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1 },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: false, sortOrder: 2 },
  { fieldKey: 'coverImage', fieldType: ContentFieldType.IMAGE, label: 'Pochette', required: false, sortOrder: 3 },
  {
    fieldKey: 'songs',
    fieldType: ContentFieldType.ENTITY_RELATION,
    label: 'Chants',
    required: false,
    sortOrder: 4,
    validation: { targetLinkedEntityType: 'Song', multiple: true },
  },
];

const playlistFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1 },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: false, sortOrder: 2 },
  { fieldKey: 'composers', fieldType: ContentFieldType.TEXTAREA, label: 'Compositeurs', required: false, sortOrder: 3 },
  {
    fieldKey: 'participants',
    fieldType: ContentFieldType.PROFILE_LIST,
    label: 'Participants',
    required: false,
    sortOrder: 4,
  },
  { fieldKey: 'audio_url', fieldType: ContentFieldType.TEXT, label: 'URL audio', required: false, sortOrder: 5 },
  { fieldKey: 'video_url', fieldType: ContentFieldType.TEXT, label: 'URL vidéo', required: false, sortOrder: 6 },
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
    label: 'Chants',
    required: false,
    sortOrder: 8,
    validation: { targetLinkedEntityType: 'Song', multiple: true },
  },
];

const teachingFieldDefinitions: FieldSeedDef[] = [
  {
    fieldKey: 'title',
    fieldType: ContentFieldType.TEXT,
    label: 'Titre',
    required: true,
    sortOrder: 1,
    showInTable: true,
  },
  {
    fieldKey: 'titleLines',
    fieldType: ContentFieldType.STRING_LIST,
    label: 'Titre (lignes d’affichage)',
    required: false,
    sortOrder: 2,
  },
  { fieldKey: 'category', fieldType: ContentFieldType.TEXT, label: 'Catégorie', required: true, sortOrder: 3 },
  { fieldKey: 'pastor', fieldType: ContentFieldType.TEXT, label: 'Pasteur / orateur', required: true, sortOrder: 4 },
  { fieldKey: 'duration', fieldType: ContentFieldType.TEXT, label: 'Durée', required: false, sortOrder: 5 },
  { fieldKey: 'reference', fieldType: ContentFieldType.TEXT, label: 'Référence biblique', required: false, sortOrder: 6 },
  { fieldKey: 'date', fieldType: ContentFieldType.TEXT, label: 'Date (libellé)', required: false, sortOrder: 7 },
  { fieldKey: 'summary', fieldType: ContentFieldType.TEXTAREA, label: 'Résumé', required: true, sortOrder: 8 },
  {
    fieldKey: 'essentialIdea',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'Idée essentielle',
    required: true,
    sortOrder: 9,
  },
  {
    fieldKey: 'overviewTitle',
    fieldType: ContentFieldType.TEXT,
    label: 'À retenir — titre',
    required: false,
    sortOrder: 10,
  },
  {
    fieldKey: 'overviewParagraph',
    fieldType: ContentFieldType.TEXTAREA,
    label: 'À retenir — texte',
    required: false,
    sortOrder: 11,
  },
  {
    fieldKey: 'scripture',
    fieldType: ContentFieldType.SCRIPTURE,
    label: 'Verset',
    required: true,
    sortOrder: 12,
  },
  {
    fieldKey: 'coverImage',
    fieldType: ContentFieldType.IMAGE,
    label: 'Image de couverture',
    required: false,
    sortOrder: 13,
  },
  {
    fieldKey: 'journey',
    fieldType: ContentFieldType.TEACHING_JOURNEY_LIST,
    label: 'Parcours de foi',
    required: true,
    sortOrder: 14,
  },
  ...notificationFieldDefinitions,
];

const programmeFieldDefinitions: FieldSeedDef[] = [
  { fieldKey: 'title', fieldType: ContentFieldType.TEXT, label: 'Titre', required: true, sortOrder: 1, showInTable: true },
  { fieldKey: 'subtitle', fieldType: ContentFieldType.TEXT, label: 'Sous-titre', required: false, sortOrder: 2 },
  { fieldKey: 'meta', fieldType: ContentFieldType.TEXT, label: 'Catégorie / surtitre', required: false, sortOrder: 3 },
  { fieldKey: 'date', fieldType: ContentFieldType.DATE, label: 'Date', required: true, sortOrder: 4, showInTable: true },
  { fieldKey: 'time', fieldType: ContentFieldType.TEXT, label: 'Heure de début', required: true, sortOrder: 5 },
  { fieldKey: 'endTime', fieldType: ContentFieldType.TEXT, label: 'Heure de fin', required: false, sortOrder: 6 },
  { fieldKey: 'location', fieldType: ContentFieldType.TEXT, label: 'Lieu', required: false, sortOrder: 7 },
  { fieldKey: 'description', fieldType: ContentFieldType.TEXTAREA, label: 'Description', required: false, sortOrder: 8 },
  { fieldKey: 'steps', fieldType: ContentFieldType.PARTICIPATION_LIST, label: 'Comment participer', required: false, sortOrder: 9 },
  { fieldKey: 'actionLabel', fieldType: ContentFieldType.TEXT, label: 'Libellé du bouton', required: false, sortOrder: 10 },
  { fieldKey: 'sourceProgramId', fieldType: ContentFieldType.TEXT, label: 'Programme source (modèle)', required: false, sortOrder: 11 },
  { fieldKey: 'isCustom', fieldType: ContentFieldType.BOOLEAN, label: 'Programme personnalisé', required: false, sortOrder: 12 },
  { fieldKey: 'displayOrder', fieldType: ContentFieldType.NUMBER, label: 'Ordre d’affichage', required: false, sortOrder: 13 },
];

const teachingsData = [
  {
    title: 'La puissance du pardon',
    titleLines: ['La puissance', 'du pardon'],
    category: 'FOI & PARDON',
    pastor: 'Pasteur Luc Mbuyi',
    duration: '32 min',
    reference: 'Colossiens 3',
    date: '13 septembre 2026',
    summary:
      "Pardonner ne nie pas la blessure. C'est choisir de ne plus lui confier la direction de notre vie.",
    essentialIdea: 'La paix commence parfois par le premier pas que personne ne voit.',
    overviewTitle:
      "Le pardon n'efface pas l'histoire. Il change ce qu'elle peut encore contrôler.",
    overviewParagraph:
      "Dans cet enseignement, nous découvrons que le pardon est d'abord une décision spirituelle : remettre à Dieu la douleur, refuser de vivre sous son emprise et choisir un chemin qui conduit vers la paix.",
    scripture: {
      text: '« Supportez-vous les uns les autres, et, si l\'un a sujet de se plaindre de l\'autre, pardonnez-vous réciproquement. »',
      reference: 'Colossiens 3:13',
    },
    coverImage:
      'https://images.unsplash.com/photo-1529070538774-1840de96b7ea?w=1200&q=80',
    journey: [
      {
        key: 'understand',
        label: 'COMPRENDRE',
        statement: "Le pardon libère d'abord votre cœur.",
        guidance:
          "Retenez cette idée comme point de départ : pardonner n'approuve pas le mal, mais refuse de lui laisser la dernière parole.",
        actionLabel: 'Je retiens',
      },
      {
        key: 'read',
        label: 'LIRE',
        statement: 'Colossiens 3:12–14',
        guidance:
          'Lisez lentement ce passage et repérez ce qu\'il vous demande de revêtir dans vos relations.',
        actionLabel: "J'ai lu",
      },
      {
        key: 'pray',
        label: 'PRIER',
        statement: 'Confiez à Dieu ce qui pèse encore.',
        guidance:
          'Nommez devant Dieu la blessure, la colère ou la personne que vous avez du mal à remettre entre Ses mains.',
        actionLabel: "J'ai prié",
      },
      {
        key: 'reflect',
        label: 'RÉFLÉCHIR',
        statement: 'Quel poids refusez-vous encore de déposer ?',
        guidance:
          'Écrivez une phrase pour vous-même. Cette note reste uniquement sur cet appareil.',
        actionLabel: 'Enregistrer ma réflexion',
        hasNote: true,
        notePlaceholder: "Aujourd'hui, je comprends que…",
      },
      {
        key: 'act',
        label: 'AGIR',
        statement: "Faites aujourd'hui un pas vers la paix.",
        guidance:
          "Ce pas peut être une conversation, une prière, un message, ou simplement la décision de ne plus nourrir l'offense.",
        actionLabel: "Je m'engage",
      },
    ],
  },
  {
    title: 'Marcher par la foi',
    titleLines: ['Marcher', 'par la foi'],
    category: 'FOI',
    pastor: 'Pasteure Esther',
    duration: '28 min',
    reference: '2 Corinthiens 5',
    date: '6 septembre 2026',
    summary:
      "La foi ne supprime pas l'incertitude. Elle nous apprend à avancer avec Dieu au milieu d'elle.",
    essentialIdea:
      "Un petit pas d'obéissance peut ouvrir un chemin que vous ne voyez pas encore.",
    overviewTitle: 'La foi avance avant de voir le chemin complet.',
    overviewParagraph:
      "Cet enseignement nous invite à déposer le besoin de tout contrôler et à faire confiance à la direction de Dieu, un pas à la fois.",
    scripture: {
      text: '« Car nous marchons par la foi et non par la vue. »',
      reference: '2 Corinthiens 5:7',
    },
    coverImage:
      'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80',
    journey: [
      {
        key: 'understand',
        label: 'COMPRENDRE',
        statement: "La foi n'est pas l'absence de doute.",
        guidance:
          'Elle est la décision de faire confiance à Dieu malgré ce que vous ne comprenez pas encore.',
        actionLabel: 'Je retiens',
      },
      {
        key: 'read',
        label: 'LIRE',
        statement: 'Hébreux 11:1–6',
        guidance:
          'Lisez ce passage et notez comment la foi a conduit des personnes ordinaires à avancer.',
        actionLabel: "J'ai lu",
      },
      {
        key: 'pray',
        label: 'PRIER',
        statement: "Demandez le courage d'un premier pas.",
        guidance:
          'Présentez à Dieu ce qui vous retient et demandez-lui la foi pour avancer.',
        actionLabel: "J'ai prié",
      },
      {
        key: 'reflect',
        label: 'RÉFLÉCHIR',
        statement: 'Quel pas Dieu vous invite-t-il à faire ?',
        guidance: 'Écrivez-le simplement. Une note laissée sur cet appareil.',
        actionLabel: 'Enregistrer ma réflexion',
        hasNote: true,
        notePlaceholder: 'Le pas que Dieu me demande…',
      },
      {
        key: 'act',
        label: 'AGIR',
        statement: "Faites aujourd'hui ce premier pas d'obéissance.",
        guidance:
          'Ce pas peut être un appel, une décision, une parole de vérité ou un engagement concret.',
        actionLabel: "Je m'engage",
      },
    ],
  },
  {
    title: 'Servir avec amour',
    titleLines: ['Servir', 'avec amour'],
    category: 'SERVICE',
    pastor: 'Pasteur Samuel',
    duration: '35 min',
    reference: 'Galates 5',
    date: '30 août 2026',
    summary:
      'Le service chrétien commence quand nous voyons réellement les besoins des personnes qui nous entourent.',
    essentialIdea: 'Nous servons mieux lorsque nous commençons par écouter.',
    overviewTitle: "On ne peut pas servir ce que l'on ne voit pas.",
    overviewParagraph:
      "Cet enseignement nous apprend à ralentir pour remarquer les besoins autour de nous, puis à y répondre avec un amour concret et humble.",
    scripture: {
      text: '« Mais que celui qui reçoit l\'instruction dans la parole fasse part de tous ses biens à celui qui l\'instruit. »',
      reference: 'Galates 6:6',
    },
    coverImage:
      'https://images.unsplash.com/photo-1469571486292-0ba58a9c6bf6?w=1200&q=80',
    journey: [
      {
        key: 'understand',
        label: 'COMPRENDRE',
        statement: "Servir, c'est d'abord voir.",
        guidance:
          'Prenez le temps de remarquer les personnes et les besoins que l\'on croise sans les regarder.',
        actionLabel: 'Je retiens',
      },
      {
        key: 'read',
        label: 'LIRE',
        statement: 'Galates 5:13–14',
        guidance:
          "Lisez ce passage et cherchez comment l'amour du prochain prend une forme concrète.",
        actionLabel: "J'ai lu",
      },
      {
        key: 'pray',
        label: 'PRIER',
        statement: 'Demandez à Dieu de vous montrer une personne.',
        guidance:
          'Demandez un regard attentif et un cœur disponible pour la semaine.',
        actionLabel: "J'ai prié",
      },
      {
        key: 'reflect',
        label: 'RÉFLÉCHIR',
        statement: 'Qui avez-vous remarqué sans jamais agir ?',
        guidance: 'Notez un nom ou une situation. Cette note reste sur cet appareil.',
        actionLabel: 'Enregistrer ma réflexion',
        hasNote: true,
        notePlaceholder: "Aujourd'hui, je veux servir…",
      },
      {
        key: 'act',
        label: 'AGIR',
        statement: 'Faites un geste concret cette semaine.',
        guidance:
          'Un appel, un service rendu, une aide discrète : un geste vaut mieux qu\'une intention.',
        actionLabel: "Je m'engage",
      },
    ],
  },
];

/**
 * Live ChurchSiteProfile (Goma) — weeklyPrograms as published, plus derived
 * recurringPrograms for “Aujourd’hui” / prochain rassemblement.
 */
const churchSiteProfileData = {
  churchName: '5ème CELPA Salem',
  tagline: 'Un lieu de paix. Une marche de foi.',
  aboutHtml:
    '<p>Nous sommes une communauté réformée qui cherche à glorifier Dieu dans la Parole, la louange et le service.</p>',
  address: 'Goma , République Démocratique du Congo',
  serviceTimesHtml:
    '<p>Deux cultes dominicaux , de 8h00 à 12h30<br>Un culte de jeunes , chaque dimanche&nbsp; à partir de 13h<br>Des cultes au courant de la semaine à partir du Mardi jusqu\'au Vendredi</p>',
  contactEmail: 'contact@celpasalem.org',
  contactPhone: '+243 XXX XXX XXX',
  socialLinks: [
    {
      label: 'Facebook',
      url: 'https://web.facebook.com/Cesam2Go/?_rdc=1&_rdr#',
    },
    {
      label: 'YouTube',
      url: 'https://www.youtube.com/@eglisecelpasalemgoma7407',
    },
  ],
  heroImage:
    'https://choir-backend.harvely.com/uploads/content/1786270791163-15124619-cb08906e-8f11-4d06-951a-405a3464fc4c.jpg',
  programsHeadline: 'Nos Programmes',
  programsIntro: 'Chaque rencontre est une étape dans votre parcours de foi',
  weeklyPrograms: [
    {
      title: 'Culte Dominical - Francophone',
      day: 'Dimanche',
      time: '08h00 – 10h00',
      description:
        "Un temps de louange, d'adoration et d'enseignement de la Parole. ",
    },
    {
      title: 'Culte Dominical - Swahili',
      day: 'Dimanche',
      time: '10h00 – 12h00',
      description:
        "Un temps de louange, d'adoration et d'enseignement de la Parole. ",
    },
    {
      title: 'Culte de jeunes',
      day: 'Dimanche',
      time: '13h00 – 15h00',
      description:
        "Un temps de louange, d'adoration et d'enseignement de la Parole. ",
    },
    {
      title: '1 heure avec Jésus',
      day: 'Lundi',
      time: '16h00 – 17h00',
      description:
        "1 heure de prière et d'adoration pour nos mamans et jeunes filles",
    },
    {
      title: 'Culte matinal',
      day: 'Mardi et Jeudi',
      time: '06h30 – 08h00',
      description: 'Culte matinal',
    },
    {
      title: 'Culte de mamans',
      day: 'Mercredi',
      time: '06h30 – 08h00',
      description: 'Culte de mamans',
    },
    {
      title: 'Culte de papas',
      day: 'Vendredi',
      time: '06h30 – 08h00',
      description: 'Culte de papas',
    },
  ],
  recurringPrograms: [
    {
      id: 'rec-culte-fr',
      title: 'Culte Dominical - Francophone',
      subtitle: 'CELPA Salem · Goma',
      time: '08h00',
      meta: 'CULTE FRANCOPHONE',
      description:
        "Un temps de louange, d'adoration et d'enseignement de la Parole.",
      daysOfWeek: [0],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Arrivez un peu en avance',
          description: 'Accueil dès 07h45 · CELPA Salem, Goma.',
        },
        {
          title: 'Venez comme vous êtes',
          description: 'Louange, adoration et enseignement en français.',
        },
      ],
    },
    {
      id: 'rec-culte-sw',
      title: 'Culte Dominical - Swahili',
      subtitle: 'CELPA Salem · Goma',
      time: '10h00',
      meta: 'CULTE SWAHILI',
      description:
        "Un temps de louange, d'adoration et d'enseignement de la Parole.",
      daysOfWeek: [0],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Rendez-vous à 10h00',
          description: 'CELPA Salem · Goma.',
        },
        {
          title: 'Venez comme vous êtes',
          description: 'Louange, adoration et enseignement en swahili.',
        },
      ],
    },
    {
      id: 'rec-culte-jeunes',
      title: 'Culte de jeunes',
      subtitle: 'CELPA Salem · Goma',
      time: '13h00',
      meta: 'CULTE DE JEUNES',
      description:
        "Un temps de louange, d'adoration et d'enseignement de la Parole.",
      daysOfWeek: [0],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Rendez-vous à 13h00',
          description: 'Chaque dimanche · CELPA Salem, Goma.',
        },
      ],
    },
    {
      id: 'rec-1h-jesus',
      title: '1 heure avec Jésus',
      subtitle: 'Mamans et jeunes filles',
      time: '16h00',
      meta: '1 HEURE AVEC JÉSUS',
      description:
        "1 heure de prière et d'adoration pour nos mamans et jeunes filles",
      daysOfWeek: [1],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Rendez-vous lundi',
          description: '16h00 – 17h00 · CELPA Salem, Goma.',
        },
      ],
    },
    {
      id: 'rec-culte-matinal',
      title: 'Culte matinal',
      subtitle: 'CELPA Salem · Goma',
      time: '06h30',
      meta: 'CULTE MATINAL',
      description: 'Culte matinal',
      daysOfWeek: [2, 4],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Mardi et jeudi',
          description: '06h30 – 08h00 · CELPA Salem, Goma.',
        },
      ],
    },
    {
      id: 'rec-culte-mamans',
      title: 'Culte de mamans',
      subtitle: 'CELPA Salem · Goma',
      time: '06h30',
      meta: 'CULTE DE MAMANS',
      description: 'Culte de mamans',
      daysOfWeek: [3],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Mercredi matin',
          description: '06h30 – 08h00 · CELPA Salem, Goma.',
        },
      ],
    },
    {
      id: 'rec-culte-papas',
      title: 'Culte de papas',
      subtitle: 'CELPA Salem · Goma',
      time: '06h30',
      meta: 'CULTE DE PAPAS',
      description: 'Culte de papas',
      daysOfWeek: [5],
      isActive: true,
      actionLabel: 'Comment participer',
      steps: [
        {
          title: 'Vendredi matin',
          description: '06h30 – 08h00 · CELPA Salem, Goma.',
        },
      ],
    },
  ],
  scheduleOverrides: [],
  contactHeadline: 'Contact & Cellules',
  contactIntro: 'Nous sommes là pour vous accueillir',
  mapEmbedUrl:
    'https://maps.google.com/maps?width=600&height=400&hl=en&q=Eglise%205%C3%A8me%20CELPA%20Salem&t=&z=14&ie=UTF8&iwloc=B&output=embed',
  homeCellsIntro:
    'Rejoignez une cellule de maison près de chez vous pour approfondir votre vie spirituelle en petit groupe dans un cadre intime et fraternel.',
  homeCells: [
    'Cellule centrale',
    'Cellule Upendo ( Rutoboko )',
    'Cellule Office',
    'Cellule Majengo',
  ],
  seoDefaults: {
    title: 'CELPA Salem — Accueil',
    description:
      'Église réformée à Goma , cultes dominicaux, études bibliques, prière et cellules de maison. Louange, Parole et communauté.',
    ogImage:
      'https://choir-backend.harvely.com/uploads/content/1786270814748-178202930-cb08906e-8f11-4d06-951a-405a3464fc4c.jpg',
    keywords: 'église Goma, CELPA Salem, culte dimanche, cellule de maison, louange',
  },
  pastorQuote:
    '« Une Église grandit lorsque la Parole devient une vie vécue. »',
  pastorMessage:
    'Nous voulons bâtir une communauté où chacun rencontre Christ, grandit dans Sa Parole et devient une bénédiction pour les autres.',
  pastorName: 'CELPA Salem',
  pastorRole: 'Pasteur principal',
  visionTitle: 'Une Église qui vit la Parole.',
  visionSummary:
    'À CELPA Salem, nous voulons que chaque personne rencontre Christ, grandisse dans Sa Parole et serve les autres avec amour.',
  visionParagraphs: [
    "Notre vision est simple et exigeante : former une communauté où la foi n'est pas seulement proclamée, mais vécue au quotidien — dans les familles, au travail, et dans le voisinage.",
    "Nous désirons être une Église ouverte, enracinée dans l'Écriture, attentive à la présence de Dieu et engagée pour la ville de Goma.",
    'Grandir ensemble signifie apprendre, prier, servir et marcher les uns avec les autres — pour que la Parole devienne une vie vécue.',
  ],
  departmentsIntroTitle: 'Une Église, plusieurs familles.',
  departmentsIntroSummary:
    'Les départements de Salem sont des espaces pour servir, apprendre et trouver sa place selon ses dons.',
  departmentsIntroParagraphs: [
    "Que vous soyez attiré par la louange, la jeunesse, l'intercession ou l'accueil, il existe une famille ministérielle où vous pouvez grandir et contribuer.",
    'Explorez nos départements et découvrez comment rejoindre une équipe.',
  ],
  responsablesTitle: 'Des serviteurs pour accompagner le corps.',
  responsablesSummary:
    "L'Église est conduite par des hommes et des femmes engagés à servir Christ et à veiller sur la communauté.",
  responsablesParagraphs: [
    'Nos responsables accompagnent la vie spirituelle, organisent les ministères et veillent à ce que chacun puisse trouver sa place à Salem.',
  ],
  churchLeaders: [
    {
      name: 'Pasteur principal',
      roleTitle: 'Direction spirituelle',
      imageUrl: '',
      bio: "Il conduit l'Église dans la Parole, la prière et la vision pastorale de CELPA Salem.",
    },
    {
      name: "Conseil d'anciens",
      roleTitle: 'Gouvernance spirituelle',
      imageUrl: '',
      bio: "Ils veillent sur la doctrine, l'unité et le discernement pastoral de la communauté.",
    },
    {
      name: 'Responsables de départements',
      roleTitle: 'Ministères',
      imageUrl: '',
      bio: "Ils animent les équipes de louange, jeunesse, intercession, accueil et autres services.",
    },
    {
      name: "Équipe d'accueil",
      roleTitle: 'Première visite',
      imageUrl: '',
      bio: 'Elle reçoit les nouveaux venus et les accompagne dans leurs premiers pas à Salem.',
    },
  ],
  historyTitle: 'Une histoire de fidélité.',
  historySummary:
    'CELPA Salem est née du désir de bâtir une communauté de foi ancrée dans la Parole et ouverte à la ville.',
  historyParagraphs: [
    "Au fil des années, Dieu a rassemblé des familles, des jeunes et des serviteurs autour d'une même conviction : l'Église est un lieu de paix, de croissance et de mission.",
    "Des cultes aux cellules de maison, des temps de prière aux projets de construction, chaque saison a consolidé notre appel à servir Goma avec amour et perseverance.",
    "Aujourd'hui encore, nous marchons avec reconnaissance — convaincus que l'histoire de Salem continue d'être écrite par Dieu, à travers une communauté en marche.",
  ],
  galleryEyebrow: 'LA VIE À SALEM',
  galleryTitle: 'Des moments vrais, une communauté vivante.',
  galleryItems: [
    {
      imageUrl:
        'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1200&q=80',
      alt: "Temps d'adoration à Salem",
      caption: 'Culte',
      large: true,
    },
    {
      imageUrl:
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900&q=80',
      alt: 'Vie de la communauté',
      caption: 'Communauté',
      large: false,
    },
    {
      imageUrl:
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80',
      alt: 'Projet de construction de Salem',
      caption: 'Bâtissons Salem',
      large: false,
    },
    {
      imageUrl:
        'https://images.unsplash.com/photo-1529070538774-1840de96b7ea?w=900&q=80',
      alt: 'Membres réunis à Salem',
      caption: "Vie de l'Église",
      large: false,
    },
  ],
  communityEyebrow: 'COMMUNAUTÉ',
  communityTitle: 'Portons-nous les uns les autres.',
  communityIntro:
    'Des nouvelles choisies avec soin, pour prier, célébrer et agir concrètement.',
  liveChannelUrl: 'https://www.youtube.com/@eglisecelpasalemgoma7407',
  livePageTitle: '5Eme Celpa Live',
  visitEyebrow: 'DÉCOUVRIR SALEM',
  visitTitle: 'Votre première fois à Salem ?',
  visitBody:
    "Le culte dure environ deux heures, en français et swahili. Venez comme vous êtes — un membre de l'équipe sera là pour vous accueillir.",
  visitCtaLabel: 'Préparer ma visite',
  visitCtaHref: '#premiere-visite',
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
  spotlightEyebrow: 'BÂTISSONS SALEM',
  spotlightTitle: '68% atteint',
  spotlightDescription:
    'Les murs sont debout. Ensemble, nous avançons maintenant vers la finalisation de la toiture.',
  spotlightPhase: 'PHASE ACTUELLE · TOITURE',
  spotlightPercent: 68,
  spotlightImage:
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1400&q=80',
};

const communityUpdatesData = [
  {
    meta: 'SUJET DE PRIÈRE · ANONYME',
    tone: 'green',
    title: 'Une famille traverse une période de soin.',
    description: 'Prions pour la paix, les forces et un rétablissement complet.',
    ctaLabel: 'Je prie',
    ctaVariant: 'outlineDark',
    href: '#contact',
    displayOrder: 1,
  },
  {
    meta: 'BESOIN COMMUNAUTAIRE',
    tone: 'orange',
    title: 'Fournitures scolaires pour six enfants.',
    description: 'Cahiers, manuels et matériel pour accompagner leur rentrée.',
    ctaLabel: 'Je peux aider',
    ctaVariant: 'green',
    href: '#contact',
    displayOrder: 2,
  },
];

const liveEventsData = [
  {
    title: 'Message de #Voeux #2023 | Celpa Salem #Goma | Rev. Pst. Mulenga',
    videoId: '2MuOi0cJi_w',
    thumbnail: 'https://img.youtube.com/vi/2MuOi0cJi_w/mqdefault.jpg',
    publishedAt: '2023-01-01T10:00:00Z',
    displayOrder: 1,
  },
  {
    title:
      '(Suite) Christ mon repos | Ev. Dr. Rémy Bisaga | 2è Culte 02 10 2022',
    videoId: 'kNvmoYZin7E',
    thumbnail: 'https://img.youtube.com/vi/kNvmoYZin7E/mqdefault.jpg',
    publishedAt: '2022-10-02T10:00:00Z',
    displayOrder: 2,
  },
  {
    title: "Scandales dans l'Eglise | Detty Mangaza | 2è Culte 18 09 2022",
    videoId: 'U6U5anNaVrc',
    thumbnail: 'https://img.youtube.com/vi/U6U5anNaVrc/mqdefault.jpg',
    publishedAt: '2022-09-18T10:00:00Z',
    displayOrder: 3,
  },
  {
    title:
      'Batissons Notre Avenir En Jésus Christ | Ancien ASANI RAMAZANI | Culte 2022 05 08',
    videoId: '-10kXLHdn-0',
    thumbnail: 'https://img.youtube.com/vi/-10kXLHdn-0/mqdefault.jpg',
    publishedAt: '2022-05-08T10:00:00Z',
    displayOrder: 4,
  },
  {
    title:
      'CELPA Salem Goma - Kanuni 10 za kushika katika kumtumukia Mungu - Rév. Pst. Luc Alimasi',
    videoId: 'k0aMEX2Zp0U',
    thumbnail: 'https://img.youtube.com/vi/k0aMEX2Zp0U/mqdefault.jpg',
    publishedAt: '2022-01-01T10:00:00Z',
    startSeconds: 1265,
    displayOrder: 5,
  },
];

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
          showInTable: fieldDef.showInTable === true,
          validation:
            fieldDef.validation !== undefined ? fieldDef.validation : null,
        });
        await fieldRepo.save(f);
      } else {
        f.fieldType = fieldDef.fieldType;
        f.label = fieldDef.label;
        f.required = fieldDef.required;
        f.sortOrder = fieldDef.sortOrder;
        if (fieldDef.showInTable !== undefined) {
          f.showInTable = fieldDef.showInTable;
        }
        if (fieldDef.validation !== undefined) {
          f.validation = fieldDef.validation;
        }
        await fieldRepo.save(f);
      }
    }
  }

  async function removeObsoleteFieldDefs(
    contentType: ContentType,
    obsoleteKeys: string[],
  ): Promise<void> {
    for (const fieldKey of obsoleteKeys) {
      await fieldRepo.delete({
        contentType: { id: contentType.id },
        fieldKey,
      });
    }
  }

  /**
   * When true the seed reverts to the legacy behaviour and REPLACES existing
   * content. By default the seed is non-destructive: existing collection rows
   * are never modified and singleton rows only receive missing keys.
   */
  const FORCE_SEED =
    process.env.SEED_FORCE === '1' ||
    process.env.SEED_FORCE === 'true' ||
    process.env.SEED_FORCE === 'yes';

  function isMissingValue(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  function mergeMissingFields(
    existing: Record<string, unknown>,
    seed: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...existing };
    for (const [key, value] of Object.entries(seed)) {
      if (isMissingValue(merged[key])) {
        merged[key] = value;
      }
    }
    return merged;
  }

  type SeedContentRowOptions = {
    contentType: ContentType;
    linkedEntityType: string;
    linkedEntityId: number;
    fieldValues: Record<string, unknown>;
    /** Natural key: when present, matching is done on `fieldValues.slug`. */
    matchSlug?: string;
    /** Behaviour when the row already exists (default: keep existing). */
    onExisting?: 'skip' | 'merge';
  };

  async function seedContentRow(opts: SeedContentRowOptions): Promise<number> {
    const { contentType, linkedEntityType, linkedEntityId, fieldValues } = opts;
    const onExisting = opts.onExisting ?? 'skip';

    let row: Content | null = null;
    if (opts.matchSlug) {
      row = await contentRepo
        .createQueryBuilder('c')
        .where('c.contentTypeId = :tid', { tid: contentType.id })
        .andWhere('c.linkedEntityType = :lt', { lt: linkedEntityType })
        .andWhere(`c."fieldValues"->>'slug' = :slug`, { slug: opts.matchSlug })
        .getOne();
    }
    if (!row) {
      row = await contentRepo.findOne({
        where: {
          contentType: { id: contentType.id },
          linkedEntityType,
          linkedEntityId,
        },
        relations: ['contentType'],
      });
    }

    if (!row) {
      const created = contentRepo.create({
        contentType,
        linkedEntityType,
        linkedEntityId,
        fieldValues,
        status: ContentStatus.PUBLISHED,
        visibility: ContentVisibility.PUBLIC,
        publishedAt: new Date(),
      });
      const saved = await contentRepo.save(created);
      return saved.id;
    }

    if (FORCE_SEED) {
      row.fieldValues = fieldValues;
    } else if (onExisting === 'merge') {
      row.fieldValues = mergeMissingFields(row.fieldValues ?? {}, fieldValues);
    } else {
      return row.id;
    }
    row.status = ContentStatus.PUBLISHED;
    row.visibility = ContentVisibility.PUBLIC;
    row.publishedAt = row.publishedAt ?? new Date();
    const saved = await contentRepo.save(row);
    return saved.id;
  }

  async function ensureAlbumStub(id: number, label: string): Promise<void> {
    await dataSource.query(
      `INSERT INTO albums (id, label) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [id, label],
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('albums', 'id'), COALESCE((SELECT MAX(id) FROM albums), 1))`,
    );
  }

  async function ensurePlaylistStub(id: number, label: string): Promise<void> {
    await dataSource.query(
      `INSERT INTO playlists (id, label) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [id, label],
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('playlists', 'id'), COALESCE((SELECT MAX(id) FROM playlists), 1))`,
    );
  }

  const churchEventType = await ensureContentType({
    name: 'Événements',
    code: 'ChurchEvent',
    description: 'Événement d’église avec programme, intervenants et lieu',
    allowedLinkedEntityTypes: ['Event'],
  });
  await ensureFieldDefs(churchEventType, churchEventFieldDefinitions);
  await removeObsoleteFieldDefs(churchEventType, ['bodyParagraphs', 'slug']);

  const departmentPageType = await ensureContentType({
    name: 'Départements',
    code: 'DepartmentPage',
    description: 'Page département avec description, galerie, chants et vidéos',
    allowedLinkedEntityTypes: ['DepartmentPage'],
  });
  await ensureFieldDefs(departmentPageType, departmentPageFieldDefinitions);
  await removeObsoleteFieldDefs(departmentPageType, ['subDepartmentSlugs', 'slug']);

  const churchSiteType = await ensureContentType({
    name: 'Profil du site',
    code: 'ChurchSiteProfile',
    description: 'Profil public de l’église / site web (singleton)',
    allowedLinkedEntityTypes: ['SiteProfile'],
  });
  await ensureFieldDefs(churchSiteType, churchSiteProfileFieldDefinitions);
  await removeObsoleteFieldDefs(churchSiteType, ['scheduleOverrides']);

  const donationType = await ensureContentType({
    name: 'Dons',
    code: 'DonationSettings',
    description: 'Textes et moyens de don publics (singleton)',
    allowedLinkedEntityTypes: ['DonationSettings'],
  });
  await ensureFieldDefs(donationType, donationSettingsFieldDefinitions);

  const albumType = await ensureContentType({
    name: 'Albums',
    code: 'Album',
    description: 'Album musical / compilation référencée par les listes de lecture',
    allowedLinkedEntityTypes: ['Album'],
  });
  await ensureFieldDefs(albumType, albumFieldDefinitions);
  await removeObsoleteFieldDefs(albumType, ['slug']);

  const playlistType = await ensureContentType({
    name: 'Listes de lecture',
    code: 'Playlist',
    description: 'Liste de lecture avec participants et lien album optionnel',
    allowedLinkedEntityTypes: ['Playlist'],
  });
  await ensureFieldDefs(playlistType, playlistFieldDefinitions);

  const teachingType = await ensureContentType({
    name: 'Enseignements',
    code: 'Teaching',
    description: 'Enseignement de la semaine avec parcours de foi',
    allowedLinkedEntityTypes: ['Teaching'],
  });
  await ensureFieldDefs(teachingType, teachingFieldDefinitions);

  const communityUpdateType = await ensureContentType({
    name: 'Communauté',
    code: 'CommunityUpdate',
    description:
      'Cartes de la section communauté (sujets de prière, entraide, nouvelles)',
    allowedLinkedEntityTypes: ['CommunityUpdate'],
  });
  await ensureFieldDefs(communityUpdateType, communityUpdateFieldDefinitions);

  const liveEventType = await ensureContentType({
    name: 'Diffusions live',
    code: 'LiveEvent',
    description: 'Rediffusions de cultes et messages (page live)',
    allowedLinkedEntityTypes: ['LiveEvent'],
  });
  await ensureFieldDefs(liveEventType, liveEventFieldDefinitions);

  const programmeType = await ensureContentType({
    name: 'Programmes',
    code: 'Programme',
    description:
      'Occurrences datées des programmes (cultes, réunions) générées depuis les programmes principaux',
    allowedLinkedEntityTypes: ['Programme'],
  });
  await ensureFieldDefs(programmeType, programmeFieldDefinitions);

  await ensureAlbumStub(1, 'Album lien #1');
  const sampleAlbumContentId = await seedContentRow({
    contentType: albumType,
    linkedEntityType: 'Album',
    linkedEntityId: 1,
    matchSlug: 'louange-recolte-2025',
    onExisting: 'merge',
    fieldValues: {
      title: 'Louange — Récolte 2025',
      slug: 'louange-recolte-2025',
      description:
        'Compilation des chants mis en avant lors des cultes de louange.',
      coverImage:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    },
  });

  console.log('✅ Seeded sample album content');

  for (let i = 0; i < churchEventsData.length; i++) {
    const raw = churchEventsData[i] as Record<string, unknown>;
    const paragraphs = raw['bodyParagraphs'];
    const { bodyParagraphs: _removed, ...rest } = raw;
    await seedContentRow({
      contentType: churchEventType,
      linkedEntityType: 'Event',
      linkedEntityId: i + 1,
      matchSlug: typeof rest.slug === 'string' ? rest.slug : undefined,
      fieldValues: {
        ...rest,
        bodyHtml: Array.isArray(paragraphs)
          ? paragraphsToHtml(
              paragraphs.filter((p): p is string => typeof p === 'string'),
            )
          : '',
      },
    });
  }
  console.log(`✅ Seeded ${churchEventsData.length} church events (preserving existing)`);

  for (let i = 0; i < communityUpdatesData.length; i++) {
    const item = communityUpdatesData[i];
    await seedContentRow({
      contentType: communityUpdateType,
      linkedEntityType: 'CommunityUpdate',
      linkedEntityId: i + 1,
      fieldValues: item as unknown as Record<string, unknown>,
    });
  }
  console.log(`✅ Seeded ${communityUpdatesData.length} community updates`);

  for (let i = 0; i < liveEventsData.length; i++) {
    const item = liveEventsData[i];
    await seedContentRow({
      contentType: liveEventType,
      linkedEntityType: 'LiveEvent',
      linkedEntityId: i + 1,
      fieldValues: item as unknown as Record<string, unknown>,
    });
  }
  console.log(`✅ Seeded ${liveEventsData.length} live events`);

  const songRepo = dataSource.getRepository(Song);

  const existingDepartmentPageCount = await contentRepo.count({
    where: { contentType: { id: departmentPageType.id } },
  });
  const shouldSeedDepartments =
    FORCE_SEED || existingDepartmentPageCount === 0;
  if (!shouldSeedDepartments) {
    console.log(
      '↷ Skipping legacy department seed (existing department pages preserved)',
    );
  }

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

  if (shouldSeedDepartments) {
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
  }

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

  if (shouldSeedDepartments) {
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

      const { songs: _songs, subDepartmentSlugs: _subSlugs, ...rest } = raw;
      await seedContentRow({
        contentType: departmentPageType,
        linkedEntityType: 'DepartmentPage',
        linkedEntityId: i + 1,
        matchSlug: slug || undefined,
        fieldValues: {
          ...rest,
          rbacDepartmentId,
          songs: songIds,
        },
      });
    }
    console.log(
      `✅ Seeded ${departmentsData.length} department pages with linked songs`,
    );
  }

  const playlistSongIds = allSeedSongIds.slice(0, 5);
  await ensurePlaylistStub(1, 'Playlist lien #1');
  await seedContentRow({
    contentType: playlistType,
    linkedEntityType: 'Playlist',
    linkedEntityId: 1,
    onExisting: 'merge',
    fieldValues: {
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
    },
  });
  console.log('✅ Seeded sample playlist with linked songs');

  await seedContentRow({
    contentType: albumType,
    linkedEntityType: 'Album',
    linkedEntityId: 1,
    matchSlug: 'louange-recolte-2025',
    onExisting: 'merge',
    fieldValues: {
      title: 'Louange — Récolte 2025',
      slug: 'louange-recolte-2025',
      description:
        'Compilation des chants mis en avant lors des cultes de louange.',
      coverImage:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      songs: playlistSongIds,
    },
  });

  await seedContentRow({
    contentType: churchSiteType,
    linkedEntityType: 'SiteProfile',
    linkedEntityId: 1,
    onExisting: 'merge',
    fieldValues: churchSiteProfileData,
  });
  console.log('✅ Seeded church site profile (existing values preserved)');

  await seedContentRow({
    contentType: donationType,
    linkedEntityType: 'DonationSettings',
    linkedEntityId: 1,
    onExisting: 'merge',
    fieldValues: donationSettingsData,
  });
  console.log('✅ Seeded donation settings (existing values preserved)');

  for (let i = 0; i < teachingsData.length; i++) {
    const teaching = teachingsData[i];
    const teachingSlug = slugify(teaching.title);
    await seedContentRow({
      contentType: teachingType,
      linkedEntityType: 'Teaching',
      linkedEntityId: i + 1,
      matchSlug: teachingSlug,
      fieldValues: {
        ...teaching,
        slug: teachingSlug,
      },
    });
  }
  console.log(`✅ Seeded ${teachingsData.length} teachings (preserving existing)`);

  console.log('🌱 Content seed completed!');
}