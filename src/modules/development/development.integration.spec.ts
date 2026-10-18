import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { DevelopmentModule } from './development.module';
import {
  DevelopmentProfile,
  DevelopmentDirectoryAccess,
  DevelopmentSector,
  DevelopmentSpecialty,
  DevelopmentSubcategory,
} from './development.entity';
import { CreateDevelopmentDirectory1792300000000 } from '../../database/migrations/1792300000000-CreateDevelopmentDirectory';
import { CreateDevelopmentDirectoryAccess1792300000001 } from '../../database/migrations/1792300000001-CreateDevelopmentDirectoryAccess';
import { importDevelopmentDirectoryAccess } from './development-access-import';
import { readFile, readdir, unlink } from 'fs/promises';
import { join } from 'path';

// Uniquement une base temporaire explicitement nommée development_test.
const url = process.env.DEVELOPMENT_TEST_DATABASE_URL;
const integration = url ? describe : describe.skip;
integration('Annuaire — PostgreSQL et endpoints', () => {
  let db: DataSource;
  let app: INestApplication;
  let personal: string;
  let directory: string;
  let specialtyId: number;
  let subcategoryId: number;
  let sectorId: number;
  let profileId: number;
  const auth = (token: string) => ({ Authorization: 'Bearer ' + token });
  const save = (token = personal) =>
    request(app.getHttpServer()).put('/development/me').set(auth(token));

  beforeAll(async () => {
    if (!url || !/^development_test(?:_|$)/.test(new URL(url).pathname.slice(1)))
      throw new Error('Une base de test dédiée est obligatoire.');
    db = new DataSource({
      type: 'postgres',
      url,
      entities: [
        DevelopmentProfile,
        DevelopmentDirectoryAccess,
        DevelopmentSector,
        DevelopmentSpecialty,
        DevelopmentSubcategory,
      ],
      migrations: [
        CreateDevelopmentDirectory1792300000000,
        CreateDevelopmentDirectoryAccess1792300000001,
      ],
      synchronize: false,
    });
    await db.initialize();
    const previousImport = process.env.DEVELOPMENT_DIRECTORY_PHONES;
    process.env.DEVELOPMENT_DIRECTORY_PHONES = '0810000000,+243810000000,810000000,+14389986297';
    try {
      await db.runMigrations();
    } finally {
      if (previousImport === undefined) delete process.env.DEVELOPMENT_DIRECTORY_PHONES;
      else process.env.DEVELOPMENT_DIRECTORY_PHONES = previousImport;
    }
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => ({ type: 'postgres' as const }),
          dataSourceFactory: async () => db,
        }),
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              DEVELOPMENT_JWT_SECRET: 'test-directory-secret-of-at-least-32-characters',
              DEVELOPMENT_DIRECTORY_PHONES: '+243810000000',
            }),
          ],
        }),
        DevelopmentModule,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    const catalog = await db
      .getRepository(DevelopmentSpecialty)
      .find({ relations: { subcategory: true } });
    specialtyId = catalog[0].id;
    subcategoryId = catalog[0].subcategoryId;
    sectorId = catalog[0].subcategory.sectorId;
    personal = (
      await request(app.getHttpServer())
        .post('/development/access')
        .send({ phone: '+243810000001', purpose: 'personal' })
        .expect(201)
    ).body.token;
    directory = (
      await request(app.getHttpServer())
        .post('/development/access')
        .send({ phone: '+243810000000', purpose: 'directory' })
        .expect(201)
    ).body.token;
  }, 30000);
  afterAll(async () => {
    if (db?.isInitialized) {
      const photos = await db.getRepository(DevelopmentProfile).find();
      for (const photo of photos)
        if (photo.photoUrl)
          await unlink(join(process.cwd(), photo.photoUrl.slice(1))).catch(() => undefined);
      await db.undoLastMigration();
      await db.undoLastMigration();
      if (app) await app.close();
      if (db.isInitialized) await db.destroy();
    }
  });
  it('importe les accès normalisés sans doublons dans la migration', async () => {
    expect(await db.getRepository(DevelopmentDirectoryAccess).count()).toBe(2);
    const login = await request(app.getHttpServer())
      .post('/development/access')
      .send({ phone: '0810000000', purpose: 'directory' })
      .expect(201);
    expect(login.body.phone).toBe('+243810000000');
    const foreign = await request(app.getHttpServer())
      .post('/development/access')
      .send({ phone: '+1 (438) 998-6297', purpose: 'directory' })
      .expect(201);
    expect(foreign.body.phone).toBe('+14389986297');
  });
  it('révoque immédiatement une session après désactivation en base', async () => {
    const repository = db.getRepository(DevelopmentDirectoryAccess);
    await repository.update({ phone: '+243810000000' }, { isActive: false });
    try {
      await request(app.getHttpServer())
        .get('/development/catalog')
        .set(auth(directory))
        .expect(403);
      await request(app.getHttpServer())
        .post('/development/access')
        .send({ phone: '810000000', purpose: 'directory' })
        .expect(403);
    } finally {
      await repository.update({ phone: '+243810000000' }, { isActive: true });
    }
    await request(app.getHttpServer()).get('/development/catalog').set(auth(directory)).expect(200);
  });
  it('importe explicitement sans réactiver les accès désactivés', async () => {
    const repository = db.getRepository(DevelopmentDirectoryAccess);
    await repository.update({ phone: '+243810000000' }, { isActive: false });
    try {
      const result = await db.transaction((manager) =>
        importDevelopmentDirectoryAccess(manager, '0810000000,+243810000000,+243810000005'),
      );
      expect(result).toEqual({ total: 2, inserted: 1 });
      expect(await repository.existsBy({ phone: '+243810000000', isActive: true })).toBe(false);
      await expect(
        db.transaction((manager) =>
          importDevelopmentDirectoryAccess(manager, '+243810000006,invalide'),
        ),
      ).rejects.toThrow();
      expect(await repository.existsBy({ phone: '+243810000006' })).toBe(false);
      await expect(repository.insert({ phone: '0810000007' })).rejects.toThrow();
      await expect(repository.insert({ phone: '+243810000005' })).rejects.toThrow();
    } finally {
      await repository.update({ phone: '+243810000000' }, { isActive: true });
    }
  });
  it('protège les routes avant identification et filtre les parcours', async () => {
    await request(app.getHttpServer()).get('/development/catalog').expect(401);
    await request(app.getHttpServer()).get('/development/people').set(auth(personal)).expect(403);
    await request(app.getHttpServer()).get('/development/me').set(auth(directory)).expect(403);
    await request(app.getHttpServer())
      .post('/development/access')
      .send({ phone: '+243810000099', purpose: 'directory' })
      .expect(403);
  });
  it('installe le catalogue français et rend ses relations disponibles', async () => {
    const response = await request(app.getHttpServer())
      .get('/development/catalog')
      .set(auth(personal))
      .expect(200);
    expect(response.body.sectors).toHaveLength(11);
    expect(response.body.specialties.length).toBeGreaterThan(70);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('crée une fiche sans photo et déduplique les spécialités', async () => {
    const response = await save()
      .field('fullName', 'Alice Test')
      .field('description', 'Soins et accompagnement')
      .field('specialties', JSON.stringify([{ id: specialtyId }, { id: specialtyId }]))
      .expect(200);
    expect(response.body.specialties).toHaveLength(1);
    expect(response.body.photoUrl).toBeNull();
    expect(response.body.phone).toBe('+243810000001');
    profileId = response.body.id;
  });
  it('charge et modifie uniquement la fiche du numéro de session', async () => {
    const response = await save()
      .field('fullName', 'Alice Modifiée')
      .field('phone', '+243810000002')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .expect(200);
    expect(response.body.phone).toBe('+243810000001');
    const updated = await save()
      .field('fullName', 'Alice Modifiée')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .expect(200);
    expect(updated.body.id).toBe(profileId);
    const other = (
      await request(app.getHttpServer())
        .post('/development/access')
        .send({ phone: '+243810000002', purpose: 'personal' })
    ).body.token;
    const me = await request(app.getHttpServer())
      .get('/development/me')
      .set(auth(other))
      .expect(200);
    expect(me.body || {}).not.toHaveProperty('fullName');
  });
  it('valide les sous-catégories et la structure des spécialités', async () => {
    await save().field('fullName', 'Alice').field('specialties', '{invalide').expect(400);
    await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ name: 'Test', subcategoryId: 999999 }]))
      .expect(400);
    await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: 'texte' }]))
      .expect(400);
    await save()
      .field('fullName', '  ')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .expect(400);
  });
  it('réutilise les spécialités normalisées et évite les doublons concurrents', async () => {
    const fields = [{ name: 'Compétence TEST', subcategoryId }];
    await Promise.all([
      save().field('fullName', 'Alice').field('specialties', JSON.stringify(fields)).expect(200),
      save()
        .field('fullName', 'Alice')
        .field('specialties', JSON.stringify([{ name: ' competence  test ', subcategoryId }]))
        .expect(200),
    ]);
    expect(await db.getRepository(DevelopmentProfile).countBy({ phone: '+243810000001' })).toBe(1);
    expect(
      await db
        .getRepository(DevelopmentSpecialty)
        .countBy({ normalizedName: 'competence test', subcategoryId }),
    ).toBe(1);
  });
  it('conserve une photo, remplace son fichier et rejette les faux fichiers', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=',
      'base64',
    );
    const first = await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .attach('photo', png, { filename: 'photo.png', contentType: 'image/png' })
      .expect(200);
    const oldPath = join(process.cwd(), first.body.photoUrl.slice(1));
    await expect(readFile(oldPath)).resolves.toEqual(png);
    const retained = await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .expect(200);
    expect(retained.body.photoUrl).toBe(first.body.photoUrl);
    const next = await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .attach('photo', png, { filename: 'autre.png', contentType: 'image/png' })
      .expect(200);
    expect(next.body.photoUrl).not.toBe(first.body.photoUrl);
    await expect(readFile(oldPath)).rejects.toThrow();
    const before = await readdir(join(process.cwd(), 'uploads', 'development'));
    await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .attach('photo', Buffer.from('faux'), { filename: 'faux.png', contentType: 'image/png' })
      .expect(400);
    await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: 999999 }]))
      .attach('photo', png, { filename: 'photo.png', contentType: 'image/png' })
      .expect(400);
    expect(await readdir(join(process.cwd(), 'uploads', 'development'))).toEqual(before);
    await save()
      .field('fullName', 'Alice')
      .field('specialties', JSON.stringify([{ id: specialtyId }]))
      .attach('photo', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'grand.png',
        contentType: 'image/png',
      })
      .expect(413);
  });
  it('combine les filtres et pagine les personnes distinctes avec tous leurs métiers', async () => {
    const all = await db.getRepository(DevelopmentSpecialty).find();
    const second = all.find((s) => s.id !== specialtyId)!;
    await db.getRepository(DevelopmentProfile).save(
      Array.from({ length: 14 }, (_, i) => ({
        phone: '+2438200000' + String(i).padStart(2, '0'),
        fullName: 'Personne ' + String(i).padStart(2, '0'),
        description: 'Activité de test',
        specialties: [{ id: specialtyId }, { id: second.id }],
      })),
    );
    const query =
      '?sectorId=' + sectorId + '&subcategoryId=' + subcategoryId + '&specialtyId=' + specialtyId;
    const first = await request(app.getHttpServer())
      .get('/development/people' + query)
      .set(auth(directory))
      .expect(200);
    expect(first.body.total).toBe(15);
    expect(first.body.items).toHaveLength(12);
    expect(first.body.totalPages).toBe(2);
    const last = await request(app.getHttpServer())
      .get('/development/people' + query + '&page=2')
      .set(auth(directory))
      .expect(200);
    expect(last.body.items).toHaveLength(3);
    expect(
      new Set([...first.body.items, ...last.body.items].map((p: DevelopmentProfile) => p.id)).size,
    ).toBe(15);
    expect(last.body.items[0].specialties).toHaveLength(2);
    const search = await request(app.getHttpServer())
      .get('/development/people?search=Personne%2003')
      .set(auth(directory))
      .expect(200);
    expect(search.body.total).toBe(1);
    const activity = await request(app.getHttpServer())
      .get('/development/people?search=Activit%C3%A9')
      .set(auth(directory))
      .expect(200);
    expect(activity.body.total).toBe(14);
    await request(app.getHttpServer())
      .get('/development/people?limit=1000')
      .set(auth(directory))
      .expect(400);
  });
});
