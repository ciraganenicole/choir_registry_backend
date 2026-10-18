import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  DevelopmentProfile,
  DevelopmentSector,
  DevelopmentSpecialty,
  DevelopmentSubcategory,
} from './development.entity';
import { DevelopmentPeopleQuery, SaveDevelopmentProfileDto } from './development.dto';
import { normalizeSpecialty } from './development.catalog';

export function photoExtension(file: Express.Multer.File): string {
  const b = file.buffer;
  if (file.size > 5 * 1024 * 1024)
    throw new BadRequestException('La photo ne doit pas dépasser 5 Mo.');
  if (
    file.mimetype === 'image/jpeg' &&
    b.length >= 3 &&
    b[0] === 0xff &&
    b[1] === 0xd8 &&
    b[2] === 0xff
  )
    return 'jpg';
  if (
    file.mimetype === 'image/png' &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'png';
  if (
    file.mimetype === 'image/webp' &&
    b.length >= 12 &&
    b.toString('ascii', 0, 4) === 'RIFF' &&
    b.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  throw new BadRequestException('Choisissez une véritable photo JPEG, PNG ou WebP.');
}

@Injectable()
export class DevelopmentService {
  constructor(private readonly db: DataSource) {}
  private readonly relations = { specialties: { subcategory: { sector: true } } };

  async catalog() {
    const [sectors, subcategories, specialties] = await Promise.all([
      this.db.getRepository(DevelopmentSector).find({ order: { name: 'ASC' } }),
      this.db.getRepository(DevelopmentSubcategory).find({ order: { name: 'ASC' } }),
      this.db.getRepository(DevelopmentSpecialty).find({ order: { name: 'ASC' } }),
    ]);
    return { sectors, subcategories, specialties };
  }

  me(phone: string) {
    return this.db
      .getRepository(DevelopmentProfile)
      .findOne({ where: { phone }, relations: this.relations });
  }

  async save(phone: string, dto: SaveDevelopmentProfileDto, photo?: Express.Multer.File) {
    let newPath: string | undefined;
    let newUrl: string | undefined;
    let previousUrl: string | null = null;
    try {
      if (photo) {
        const filename = randomUUID() + '.' + photoExtension(photo);
        const directory = join(process.cwd(), 'uploads', 'development');
        await mkdir(directory, { recursive: true });
        newPath = join(directory, filename);
        await writeFile(newPath, photo.buffer);
        newUrl = '/uploads/development/' + filename;
      }
      previousUrl = await this.db.transaction(async (manager) => {
        // Sérialiser les soumissions du même numéro, même si sa fiche n’existe pas encore.
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['development:' + phone]);
        const repository = manager.getRepository(DevelopmentProfile);
        const existing = await repository.findOneBy({ phone });
        const oldUrl = existing?.photoUrl ?? null;
        const ids: number[] = [];
        // Un ordre stable évite les interblocages entre créations concurrentes de métiers.
        const inputs = [...dto.specialties].sort(
          (a, b) =>
            (a.subcategoryId || 0) - (b.subcategoryId || 0) ||
            normalizeSpecialty(a.name || '').localeCompare(normalizeSpecialty(b.name || '')),
        );
        for (const input of inputs) {
          if (input.id) {
            if (input.name !== undefined || input.subcategoryId !== undefined)
              throw new BadRequestException(
                'Choisissez une spécialité existante ou créez-en une nouvelle.',
              );
            const specialty = await manager
              .getRepository(DevelopmentSpecialty)
              .findOneBy({ id: input.id });
            if (!specialty)
              throw new BadRequestException(
                'Une spécialité sélectionnée n’existe plus. Rechargez le formulaire.',
              );
            ids.push(specialty.id);
          } else {
            const name = input.name?.trim().replace(/\s+/g, ' ');
            if (!name || name.length > 120 || !input.subcategoryId)
              throw new BadRequestException(
                'Précisez le nom et la sous-catégorie de chaque nouvelle spécialité.',
              );
            const subcategory = await manager
              .getRepository(DevelopmentSubcategory)
              .findOneBy({ id: input.subcategoryId });
            if (!subcategory)
              throw new BadRequestException('La sous-catégorie sélectionnée est invalide.');
            const [specialty] = await manager.query(
              `INSERT INTO development_specialties (name, "normalizedName", "subcategoryId") VALUES ($1, $2, $3)
               ON CONFLICT ("subcategoryId", "normalizedName") DO UPDATE SET "normalizedName" = EXCLUDED."normalizedName" RETURNING id`,
              [name, normalizeSpecialty(name), input.subcategoryId],
            );
            ids.push(specialty.id);
          }
        }
        const specialties = await manager
          .getRepository(DevelopmentSpecialty)
          .findBy({ id: In([...new Set(ids)]) });
        const profile = repository.create({
          ...existing,
          phone,
          fullName: dto.fullName,
          description: dto.description?.trim() || '',
          photoUrl: newUrl ?? oldUrl,
          specialties,
        });
        await repository.save(profile);
        return oldUrl;
      });
    } catch (error) {
      if (newPath) await unlink(newPath).catch(() => undefined);
      throw error;
    }
    if (
      newUrl &&
      previousUrl &&
      /^\/uploads\/development\/[a-f0-9-]+\.(jpg|png|webp)$/.test(previousUrl)
    ) {
      await unlink(join(process.cwd(), previousUrl.slice(1))).catch(() => undefined);
    }
    return this.me(phone);
  }

  async people(query: DevelopmentPeopleQuery) {
    const { page = 1, limit = 12 } = query;
    // Le filtre et les relations affichées sont séparés pour conserver tous les métiers de la fiche.
    const filtered = this.db
      .getRepository(DevelopmentProfile)
      .createQueryBuilder('profile')
      .innerJoin('profile.specialties', 'match')
      .innerJoin('match.subcategory', 'category');
    if (query.sectorId)
      filtered.andWhere('category.sectorId = :sectorId', { sectorId: query.sectorId });
    if (query.subcategoryId)
      filtered.andWhere('category.id = :subcategoryId', { subcategoryId: query.subcategoryId });
    if (query.specialtyId)
      filtered.andWhere('match.id = :specialtyId', { specialtyId: query.specialtyId });
    if (query.search?.trim()) {
      const search = '%' + query.search.trim().replace(/[\\%_]/g, '\\$&') + '%';
      filtered.andWhere(
        `(profile.fullName ILIKE :search OR profile.description ILIKE :search OR match.name ILIKE :search)`,
        { search },
      );
    }
    const [pageRows, total] = await filtered
      .select(['profile.id', 'profile.fullName'])
      .distinct(true)
      .orderBy('profile.fullName', 'ASC')
      .addOrderBy('profile.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const items = pageRows.length
      ? await this.db.getRepository(DevelopmentProfile).find({
          where: { id: In(pageRows.map((p) => p.id)) },
          relations: this.relations,
          order: { fullName: 'ASC', id: 'ASC' },
        })
      : [];
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
