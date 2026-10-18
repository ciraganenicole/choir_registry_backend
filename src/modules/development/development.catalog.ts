export const DEVELOPMENT_CATALOG: Record<string, Record<string, string[]>> = {
  'Santé et action sociale': {
    'Soins et médecine': [
      'Médecin',
      'Infirmier / Infirmière',
      'Sage-femme',
      'Pharmacien / Pharmacienne',
      'Dentiste',
      'Kinésithérapeute',
    ],
    'Accompagnement social': [
      'Psychologue',
      'Assistant social / Assistante sociale',
      'Éducateur spécialisé / Éducatrice spécialisée',
    ],
  },
  'Enseignement et formation': {
    Enseignement: [
      'Enseignant / Enseignante',
      'Professeur / Professeure',
      'Éducateur / Éducatrice',
    ],
    'Formation et recherche': [
      'Formateur / Formatrice',
      'Chercheur / Chercheuse',
      'Conseiller pédagogique / Conseillère pédagogique',
    ],
  },
  'Construction et habitat': {
    Bâtiment: [
      'Maçon / Maçonne',
      'Architecte',
      'Ingénieur civil / Ingénieure civile',
      'Charpentier / Charpentière',
    ],
    'Installation et entretien': [
      'Électricien / Électricienne',
      'Plombier / Plombière',
      'Peintre en bâtiment',
      'Technicien frigoriste / Technicienne frigoriste',
    ],
  },
  'Agriculture et environnement': {
    'Production agricole': [
      'Agriculteur / Agricultrice',
      'Agronome',
      'Éleveur / Éleveuse',
      'Maraîcher / Maraîchère',
    ],
    Environnement: [
      'Technicien forestier / Technicienne forestière',
      'Spécialiste en gestion des déchets',
      'Jardinier / Jardinière',
    ],
  },
  'Commerce et restauration': {
    Commerce: ['Commerçant / Commerçante', 'Vendeur / Vendeuse', 'Entrepreneur / Entrepreneuse'],
    'Restauration et hôtellerie': [
      'Cuisinier / Cuisinière',
      'Pâtissier / Pâtissière',
      'Serveur / Serveuse',
      'Hôtelier / Hôtelière',
    ],
  },
  'Artisanat et services': {
    'Fabrication et réparation': [
      'Couturier / Couturière',
      'Menuisier / Menuisière',
      'Soudeur / Soudeuse',
      'Cordonnier / Cordonnière',
      'Mécanicien / Mécanicienne',
    ],
    'Services à la personne': [
      'Coiffeur / Coiffeuse',
      'Esthéticien / Esthéticienne',
      'Agent / Agente d’entretien',
    ],
  },
  'Technologie et numérique': {
    Informatique: [
      'Développeur / Développeuse',
      'Technicien informatique / Technicienne informatique',
      'Administrateur réseau / Administratrice réseau',
      'Analyste de données',
    ],
    'Télécommunications et électronique': [
      'Technicien télécoms / Technicienne télécoms',
      'Électronicien / Électronicienne',
    ],
  },
  'Administration, droit et finances': {
    'Gestion et finances': [
      'Comptable',
      'Gestionnaire',
      'Banquier / Banquière',
      'Auditeur / Auditrice',
    ],
    'Droit et administration': [
      'Juriste',
      'Avocat / Avocate',
      'Secrétaire',
      'Agent administratif / Agente administrative',
      'Spécialiste en ressources humaines',
    ],
  },
  'Transport et logistique': {
    Transport: [
      'Chauffeur / Chauffeuse',
      'Conducteur / Conductrice de moto',
      'Mécanicien automobile / Mécanicienne automobile',
    ],
    Logistique: [
      'Logisticien / Logisticienne',
      'Magasinier / Magasinière',
      'Agent / Agente de livraison',
    ],
  },
  'Communication, arts et médias': {
    'Communication et médias': [
      'Journaliste',
      'Traducteur / Traductrice',
      'Chargé / Chargée de communication',
      'Gestionnaire de réseaux sociaux',
    ],
    'Création et événementiel': [
      'Graphiste',
      'Photographe',
      'Vidéaste',
      'Musicien / Musicienne',
      'Décorateur / Décoratrice',
      'Technicien / Technicienne du son',
    ],
  },
  'Autres activités': {
    'Autres compétences': ['Étudiant / Étudiante', 'Bénévole', 'Porteur / Porteuse de projet'],
  },
};
export function normalizeSpecialty(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim()
    .replace(/\s+/g, ' ');
}
