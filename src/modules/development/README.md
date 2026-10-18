# Annuaire des compétences — backend

Module autonome, sans dépendance aux comptes, rôles et professions du registre des choristes.

## Installation

Ajouter les variables de [.env.development.example](../../../.env.development.example) à l’environnement du backend :

- `DEVELOPMENT_JWT_SECRET` : secret dédié de 32 caractères minimum, différent de `JWT_SECRET`. Aucune valeur implicite. Sans configuration, seuls les accès à ce nouveau module sont indisponibles ; les autres modules continuent de fonctionner.
- `DEVELOPMENT_DIRECTORY_PHONES` : source facultative d’import initial, séparée par des virgules. La migration `CreateDevelopmentDirectoryAccess1792300000001` reprend cette liste une seule fois dans `development_directory_access`. À la connexion, seule la base est consultée : modifier cette variable ne change plus les accès.
- `DEVELOPMENT_CORS_ORIGINS` : origines du nouveau frontend en production, séparées par des virgules. Les origines existantes sont conservées.

Depuis `choir_registry_backend` :

```powershell
npm.cmd ci
npm.cmd run migration:run
npm.cmd run build
npm.cmd start
```

La migration `CreateDevelopmentDirectory1792300000000` crée cinq tables et initialise 11 secteurs avec leurs sous-catégories et métiers. Les fiches et spécialités de cette application restent séparées du registre existant.

Vérifier les migrations en attente avant de lancer la commande sur un environnement existant. La commande TypeORM du dépôt applique toutes les migrations en attente ; ne pas exécuter la migration automatiquement au démarrage de l’application.

## Numéros autorisés en base

La table `development_directory_access` contient `phone` (clé primaire au format international), `isActive` (booléen, vrai par défaut) et `createdAt`. Les numéros locaux sont toujours normalisés : `853242606` et `0853242606` identifient la même ligne `+243853242606`.

La table est contrôlée à chaque ouverture de session et à chaque requête d’une session responsable. Supprimer une ligne ou passer `isActive` à faux révoque immédiatement cet accès, sans redémarrage. Une table vide interdit l’annuaire. L’inscription personnelle conserve son accès par numéro personnel.

Pour modifier les accès dans votre outil de base de données (numéros d’exemple à remplacer) :

```sql
-- Autoriser un nouveau numéro ; conserver un éventuel accès existant.
INSERT INTO development_directory_access (phone)
VALUES ('+243810000000') ON CONFLICT (phone) DO NOTHING;

-- Désactiver ou réactiver explicitement un numéro.
UPDATE development_directory_access SET "isActive" = false
WHERE phone = '+243810000000';
UPDATE development_directory_access SET "isActive" = true
WHERE phone = '+243810000000';
```

Pour importer explicitement une nouvelle liste depuis `DEVELOPMENT_DIRECTORY_PHONES`, après application de la migration :

```powershell
npm.cmd run development:access:import
```

L’import normalise et déduplique les numéros ; il ne supprime aucune ligne et ne réactive aucun numéro désactivé. La liste d’environnement peut être retirée après l’import. Elle n’est jamais utilisée comme solution de repli pendant une connexion.

Le secret `DEVELOPMENT_JWT_SECRET` reste nécessaire pour signer les sessions. Le définir dans l’environnement **du serveur backend**, y compris en production ; une copie locale de `.env` n’est pas transmise au serveur par Git.

## API

Toutes les routes protégées utilisent `Authorization: Bearer <jeton>`. Les jetons de ce module ont un secret, une audience et un émetteur dédiés ; les jetons des choristes sont refusés.

| Méthode | Route | Accès | Entrée et résultat |
| --- | --- | --- | --- |
| POST | /development/access | Sans session | JSON `{ phone, purpose: "personal" ou "directory" }` ; retourne `{ token, phone, purpose, expiresAt }` |
| GET | /development/catalog | Les deux parcours | `{ sectors, subcategories, specialties }`, triés par nom |
| GET | /development/me | Personnel | Fiche de son numéro ou réponse vide si elle n’existe pas |
| PUT | /development/me | Personnel | Multipart décrit ci-dessous ; retourne la fiche enregistrée |
| GET | /development/people | Responsables | Liste paginée décrite ci-dessous |

Les routes de données et d’accès renvoient `Cache-Control: no-store`.

### Enregistrement

Champs multipart :

- `fullName` : nom complet, 1 à 160 caractères après suppression des espaces de début et fin.
- `description` : facultative, 2 000 caractères maximum. Absente ou vide : description vide.
- `specialties` : chaîne JSON représentant 1 à 30 éléments. Spécialité existante : `{ "id": 12 }`. Nouvelle spécialité : `{ "name": "Mon métier", "subcategoryId": 3 }`.
- `photo` : un fichier facultatif JPEG, PNG ou WebP, 5 Mo maximum. Le type déclaré et sa signature sont contrôlés.

Le numéro de la fiche vient exclusivement du jeton. Aucun identifiant de fiche ou numéro transmis dans le formulaire ne permet de modifier la fiche d’une autre personne. Les soumissions sont sérialisées par numéro dans une transaction PostgreSQL. Les contraintes d’unicité et la résolution des conflits empêchent les doublons de fiches, spécialités et associations.

Une nouvelle spécialité est réutilisée si son libellé normalisé correspond dans la même sous-catégorie : casse, accents et espaces multiples sont ignorés. Les secteurs et sous-catégories ne sont pas créés par les participants.

Sans nouvelle photo, conserver la photo existante. Après remplacement réussi, supprimer l’ancienne photo ; en cas d’échec, supprimer le nouveau fichier. Les photos sont stockées dans `uploads/development/`, servi par le mécanisme statique existant : leurs URL sont accessibles à qui les connaît. Prévoir un volume persistant.

### Annuaire

Paramètres : `page` (défaut 1), `limit` (12, 24 ou 48 ; défaut 12), `search`, `sectorId`, `subcategoryId`, `specialtyId`.

Recherche insensible à la casse sur le nom, la description ou une spécialité. Les filtres de classement se combinent sur la même spécialité. Les résultats conservent toutes les spécialités de chaque personne, même lorsqu’un filtre ne correspond qu’à l’une d’elles.

Réponse : `{ items, total, page, limit, totalPages }`. Tri par nom puis identifiant. Les totaux et la pagination comptent les personnes distinctes.

Les fiches incluent `id, phone, fullName, description, photoUrl, specialties, createdAt, updatedAt`. Chaque spécialité inclut sa sous-catégorie et son secteur.

## Accès temporaire

Sans SMS ni mot de passe supplémentaire : connaître un numéro suffit à modifier sa fiche ; connaître un numéro de responsable autorisé suffit à consulter l’annuaire. C’est le comportement demandé pour cette application temporaire.

## Tests

```powershell
npm.cmd test -- --runInBand development.auth.spec
```

Pour tester migration, contraintes, accès, photos, concurrence, recherche et pagination sur une **base jetable distincte**, créer une base nommée `development_test` :

```powershell
$env:DEVELOPMENT_TEST_DATABASE_URL = 'postgresql://test_user:test_password@127.0.0.1:55432/development_test'
npm.cmd test -- --runInBand development.integration.spec
```

Sans cette variable, les tests d’intégration sont ignorés. Leur nettoyage annule les deux migrations de ce module et supprime les photos créées pendant le test. Ne jamais fournir une base contenant des fiches à conserver.
