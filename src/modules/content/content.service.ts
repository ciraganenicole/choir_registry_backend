import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ContentType } from './content-type.entity';
import { ContentFieldDefinition } from './content-field-definition.entity';
import { Content } from './content.entity';
import { ContentFieldType } from './enums/content-field-type.enum';
import { ContentStatus } from './enums/content-status.enum';
import { ContentVisibility } from './enums/content-visibility.enum';
import { isLinkedEntityType, LinkedEntityType } from './linked-entity-type';
import { RbacService } from '../users/rbac.service';
import {
  PERMISSION_CODES,
  CONTENT_MODULE_ACCESS_CODES,
} from '../users/permission-codes.constant';
import { CreateContentTypeDto, UpdateContentTypeDto } from './dto/content-type.dto';
import {
  CreateContentFieldDto,
  UpdateContentFieldDto,
} from './dto/content-field.dto';
import {
  CreateContentDto,
  ListContentQueryDto,
  UpdateContentDto,
} from './dto/content-instance.dto';
import { Department } from '../users/department.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { ContentJwtUser, isAdminCmsUser } from './content.types';

export type PaginatedContents = {
  items: Content[];
  total: number;
  page: number;
  limit: number;
};

const LINKED_ENTITY_TABLE: Record<LinkedEntityType, string> = {
  Performance: 'performances',
  Communique: 'communiques',
  User: 'users',
  Department: 'departments',
  Rehearsal: 'rehearsals',
  Song: 'songs',
  Report: 'reports',
  Event: '',
  DepartmentPage: '',
  SiteProfile: '',
  DonationSettings: '',
  Album: 'albums',
  Playlist: 'playlists',
};

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentType)
    private readonly typeRepo: Repository<ContentType>,
    @InjectRepository(ContentFieldDefinition)
    private readonly fieldRepo: Repository<ContentFieldDefinition>,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    private readonly rbac: RbacService,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  private choirUserIdForRbac(principal: ContentJwtUser): number {
    if (principal.type === 'user') {
      return principal.id;
    }
    throw new ForbiddenException('Invalid principal for choir RBAC');
  }

  private async resolveChoirUserIdForFk(
    principal: ContentJwtUser,
  ): Promise<number | null> {
    if (principal.type === 'user') {
      return principal.id;
    }
    if (principal.type === 'admin' && principal.email) {
      const u = await this.usersService.findByEmail(principal.email);
      return u?.id ?? null;
    }
    return null;
  }

  private async assertModuleAccess(principal: ContentJwtUser): Promise<void> {
    if (isAdminCmsUser(principal)) {
      return;
    }
    const userId = this.choirUserIdForRbac(principal);
    const codes = await this.rbac.getAllPermissionCodesFlat(userId);
    if (
      !this.rbac.hasAnyCode(codes, [...CONTENT_MODULE_ACCESS_CODES])
    ) {
      throw new ForbiddenException('No access to content module');
    }
  }

  private async assertSchemaManage(principal: ContentJwtUser): Promise<void> {
    if (isAdminCmsUser(principal)) {
      return;
    }
    const userId = this.choirUserIdForRbac(principal);
    const codes = await this.rbac.getAllPermissionCodesFlat(userId);
    if (
      !codes.has(PERMISSION_CODES.GLOBAL_PUBLISHER) &&
      !codes.has(PERMISSION_CODES.CONTENT_SCHEMA_MANAGE)
    ) {
      throw new ForbiddenException('Cannot manage content types');
    }
  }

  private async canWriteForAudience(
    principal: ContentJwtUser,
    audienceDepartmentId: number | null,
  ): Promise<boolean> {
    if (isAdminCmsUser(principal)) {
      return true;
    }
    const userId = this.choirUserIdForRbac(principal);
    const eff = await this.rbac.getEffectivePermissions(userId);
    const codes = this.rbac.codesForAudience(eff, audienceDepartmentId);
    if (
      codes.has(PERMISSION_CODES.GLOBAL_EDITOR) ||
      codes.has(PERMISSION_CODES.GLOBAL_PUBLISHER)
    ) {
      return true;
    }
    return (
      audienceDepartmentId != null &&
      codes.has(PERMISSION_CODES.CONTENT_DEPARTMENT_EDIT)
    );
  }

  private async canApproveForAudience(
    principal: ContentJwtUser,
    audienceDepartmentId: number | null,
  ): Promise<boolean> {
    if (isAdminCmsUser(principal)) {
      return true;
    }
    const userId = this.choirUserIdForRbac(principal);
    const eff = await this.rbac.getEffectivePermissions(userId);
    const codes = this.rbac.codesForAudience(eff, audienceDepartmentId);
    if (codes.has(PERMISSION_CODES.GLOBAL_PUBLISHER)) return true;
    if (codes.has(PERMISSION_CODES.CONTENT_DEPARTMENT_APPROVE)) return true;
    if (codes.has(PERMISSION_CODES.CONTENT_DEPARTMENT_EDIT)) return true;
    return false;
  }

  private async canReadContentRow(
    principal: ContentJwtUser,
    row: Content,
  ): Promise<boolean> {
    if (isAdminCmsUser(principal)) {
      return true;
    }
    const userId = this.choirUserIdForRbac(principal);
    const eff = await this.rbac.getEffectivePermissions(userId);
    const codes = this.rbac.codesForAudience(
      eff,
      row.audienceDepartment?.id ?? null,
    );

    if (row.status === ContentStatus.PUBLISHED) {
      if (row.visibility === ContentVisibility.PUBLIC) {
        return true;
      }
      return (
        codes.has(PERMISSION_CODES.GLOBAL_VIEWER) ||
        codes.has(PERMISSION_CODES.GLOBAL_EDITOR) ||
        codes.has(PERMISSION_CODES.GLOBAL_PUBLISHER) ||
        codes.has(PERMISSION_CODES.CONTENT_DEPARTMENT_EDIT)
      );
    }

    const authorId = row.author?.id;
    if (authorId === userId) return true;

    return (
      codes.has(PERMISSION_CODES.GLOBAL_EDITOR) ||
      codes.has(PERMISSION_CODES.GLOBAL_PUBLISHER) ||
      codes.has(PERMISSION_CODES.CONTENT_DEPARTMENT_EDIT)
    );
  }

  private async assertLinkedRowExists(
    linkedType: string,
    linkedId: number,
  ): Promise<void> {
    if (!isLinkedEntityType(linkedType)) {
      throw new BadRequestException(`Unknown linkedEntityType: ${linkedType}`);
    }
    const table = LINKED_ENTITY_TABLE[linkedType];
    const rows = await this.dataSource.query(
      `SELECT 1 FROM "${table}" WHERE id = $1 LIMIT 1`,
      [linkedId],
    );
    if (!rows?.length) {
      throw new NotFoundException(
        `Linked ${linkedType} with id ${linkedId} not found`,
      );
    }
  }

  validateFieldValues(
    definitions: ContentFieldDefinition[],
    fieldValues: Record<string, unknown>,
    stripUnknown: boolean,
  ): Record<string, unknown> {
    const allowedKeys = new Set(definitions.map((d) => d.fieldKey));
    const out: Record<string, unknown> = {};

    for (const def of definitions) {
      const v = fieldValues[def.fieldKey];
      const missingRequired =
        def.required &&
        (v === undefined ||
          v === null ||
          v === '' ||
          (Array.isArray(v) && v.length === 0));
      if (missingRequired) {
        throw new BadRequestException(`Missing required field: ${def.fieldKey}`);
      }
      if (v === undefined || v === null || v === '') continue;

      this.assertValueMatchesType(def.fieldKey, def.fieldType, v, def.validation);
      out[def.fieldKey] = v;
    }

    if (!stripUnknown) {
      for (const key of Object.keys(fieldValues)) {
        if (!allowedKeys.has(key)) {
          throw new BadRequestException(`Unknown field key: ${key}`);
        }
      }
    }

    return out;
  }

  private assertValueMatchesType(
    key: string,
    fieldType: ContentFieldType,
    v: unknown,
    validation: Record<string, unknown> | null,
  ): void {
    const bad = () =>
      new BadRequestException(`Invalid value type for field "${key}"`);

    switch (fieldType) {
      case ContentFieldType.TEXT:
      case ContentFieldType.TEXTAREA:
      case ContentFieldType.HTML:
      case ContentFieldType.IMAGE:
        if (typeof v !== 'string') throw bad();
        break;
      case ContentFieldType.NUMBER:
        if (typeof v !== 'number' || Number.isNaN(v)) throw bad();
        break;
      case ContentFieldType.BOOLEAN:
        if (typeof v !== 'boolean') throw bad();
        break;
      case ContentFieldType.DATE:
        if (typeof v !== 'string') throw bad();
        break;
      case ContentFieldType.IMAGES:
        if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
          throw bad();
        }
        break;
      case ContentFieldType.RELATION:
      case ContentFieldType.ENTITY_RELATION: {
        const multiple =
          validation &&
          typeof validation === 'object' &&
          validation['multiple'] === true;
        if (multiple) {
          if (
            !Array.isArray(v) ||
            !v.every(
              (x) =>
                typeof x === 'number' &&
                Number.isFinite(x) &&
                Number.isInteger(x),
            )
          ) {
            throw bad();
          }
        } else if (
          typeof v !== 'number' ||
          !Number.isFinite(v) ||
          !Number.isInteger(v)
        ) {
          throw bad();
        }
        break;
      }
      case ContentFieldType.PROFILE_LIST: {
        if (!Array.isArray(v)) throw bad();
        for (const item of v) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw bad();
          }
          const o = item as Record<string, unknown>;
          if (typeof o.name !== 'string') throw bad();
          if (typeof o.roleTitle !== 'string') throw bad();
          if (
            o.imageUrl !== undefined &&
            o.imageUrl !== null &&
            typeof o.imageUrl !== 'string'
          ) {
            throw bad();
          }
        }
        break;
      }
      case ContentFieldType.VIDEO_LIST: {
        if (!Array.isArray(v)) throw bad();
        const sources = new Set(['youtube', 'url', 'upload']);
        for (const item of v) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw bad();
          }
          const o = item as Record<string, unknown>;
          if (typeof o.title !== 'string' || !o.title.trim()) throw bad();
          if (typeof o.thumbnail !== 'string' || !o.thumbnail.trim()) {
            throw bad();
          }
          if (typeof o.publishedAt !== 'string' || !o.publishedAt.trim()) {
            throw bad();
          }
          if (o.id !== undefined && o.id !== null && typeof o.id !== 'string') {
            throw bad();
          }
          let source =
            typeof o.source === 'string' ? o.source.trim() : '';
          if (!source && typeof o.videoId === 'string' && o.videoId.trim()) {
            source = 'youtube';
          }
          if (!sources.has(source)) throw bad();
          if (source === 'youtube') {
            if (typeof o.videoId !== 'string' || !o.videoId.trim()) {
              throw bad();
            }
          } else if (source === 'url' || source === 'upload') {
            if (typeof o.videoUrl !== 'string' || !o.videoUrl.trim()) {
              throw bad();
            }
          }
        }
        break;
      }
      default:
        throw new BadRequestException(`Unsupported field type: ${fieldType}`);
    }
  }

  private async validateRelationTargets(
    definitions: ContentFieldDefinition[],
    fieldValues: Record<string, unknown>,
  ): Promise<void> {
    for (const def of definitions) {
      if (def.fieldType !== ContentFieldType.RELATION) continue;
      const v = fieldValues[def.fieldKey];
      if (v === undefined || v === null) continue;
      const rawCode = def.validation?.['targetContentTypeCode'];
      const code =
        typeof rawCode === 'string' ? rawCode.trim() : '';
      if (!code) {
        throw new BadRequestException(
          `Relation field "${def.fieldKey}" is missing validation.targetContentTypeCode`,
        );
      }
      const targetType = await this.typeRepo.findOne({
        where: { code },
      });
      if (!targetType) {
        throw new BadRequestException(`Unknown content type code: ${code}`);
      }
      const ids = Array.isArray(v) ? v : [v];
      for (const id of ids) {
        if (typeof id !== 'number' || !Number.isInteger(id)) continue;
        const count = await this.contentRepo.count({
          where: {
            id,
            contentType: { id: targetType.id },
          },
        });
        if (count < 1) {
          throw new BadRequestException(
            `Referenced content id ${id} not found for type "${code}"`,
          );
        }
      }
    }
  }

  private async validateEntityRelationTargets(
    definitions: ContentFieldDefinition[],
    fieldValues: Record<string, unknown>,
  ): Promise<void> {
    for (const def of definitions) {
      if (def.fieldType !== ContentFieldType.ENTITY_RELATION) continue;
      const v = fieldValues[def.fieldKey];
      if (v === undefined || v === null) continue;
      const rawType = def.validation?.['targetLinkedEntityType'];
      const linkedType =
        typeof rawType === 'string' ? rawType.trim() : '';
      if (!linkedType) {
        throw new BadRequestException(
          `Entity relation field "${def.fieldKey}" is missing validation.targetLinkedEntityType`,
        );
      }
      if (!isLinkedEntityType(linkedType)) {
        throw new BadRequestException(
          `Unknown targetLinkedEntityType: ${linkedType}`,
        );
      }
      const table = LINKED_ENTITY_TABLE[linkedType];
      if (!table) {
        throw new BadRequestException(
          `Entity relation target "${linkedType}" has no backing table`,
        );
      }
      const ids = Array.isArray(v) ? v : [v];
      for (const id of ids) {
        if (typeof id !== 'number' || !Number.isInteger(id)) continue;
        await this.assertLinkedRowExists(linkedType, id);
      }
    }
  }

  private async validateFieldRelations(
    definitions: ContentFieldDefinition[],
    fieldValues: Record<string, unknown>,
  ): Promise<void> {
    await this.validateRelationTargets(definitions, fieldValues);
    await this.validateEntityRelationTargets(definitions, fieldValues);
  }

  private assertLinkedAllowedForType(
    contentType: ContentType,
    linkedType: string,
  ): void {
    const allowed = contentType.allowedLinkedEntityTypes;
    if (!allowed?.length) {
      if (!isLinkedEntityType(linkedType)) {
        throw new BadRequestException(`Invalid linkedEntityType: ${linkedType}`);
      }
      return;
    }
    if (!allowed.includes(linkedType)) {
      throw new BadRequestException(
        `linkedEntityType ${linkedType} not allowed for this content type`,
      );
    }
  }

  async loadTypeWithFields(typeId: number): Promise<{
    type: ContentType;
    fields: ContentFieldDefinition[];
  }> {
    const type = await this.typeRepo.findOne({ where: { id: typeId } });
    if (!type) throw new NotFoundException('Content type not found');
    const fields = await this.fieldRepo.find({
      where: { contentType: { id: typeId } },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return { type, fields };
  }

  // --- Content types (schema) ---
  async createType(
    principal: ContentJwtUser,
    dto: CreateContentTypeDto,
  ): Promise<ContentType> {
    await this.assertSchemaManage(principal);
    const entity = this.typeRepo.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
      allowedLinkedEntityTypes: dto.allowedLinkedEntityTypes ?? null,
    });
    return this.typeRepo.save(entity);
  }

  async findAllTypes(principal: ContentJwtUser): Promise<ContentType[]> {
    await this.assertModuleAccess(principal);
    return this.typeRepo.find({ order: { name: 'ASC' } });
  }

  async findTypeById(
    principal: ContentJwtUser,
    id: number,
  ): Promise<ContentType> {
    await this.assertModuleAccess(principal);
    const t = await this.typeRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Content type not found');
    return t;
  }

  async findTypeWithFields(principal: ContentJwtUser, id: number) {
    await this.assertModuleAccess(principal);
    const { type, fields } = await this.loadTypeWithFields(id);
    return { ...type, fieldDefinitions: fields };
  }

  async updateType(
    principal: ContentJwtUser,
    id: number,
    dto: UpdateContentTypeDto,
  ): Promise<ContentType> {
    await this.assertSchemaManage(principal);
    const t = await this.typeRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Content type not found');
    if (dto.name !== undefined) t.name = dto.name;
    if (dto.code !== undefined) t.code = dto.code;
    if (dto.description !== undefined) t.description = dto.description;
    if (dto.isActive !== undefined) t.isActive = dto.isActive;
    if (dto.allowedLinkedEntityTypes !== undefined) {
      t.allowedLinkedEntityTypes = dto.allowedLinkedEntityTypes;
    }
    return this.typeRepo.save(t);
  }

  async addField(
    principal: ContentJwtUser,
    typeId: number,
    dto: CreateContentFieldDto,
  ): Promise<ContentFieldDefinition> {
    await this.assertSchemaManage(principal);
    await this.findTypeById(principal, typeId);
    const f = this.fieldRepo.create({
      contentType: { id: typeId } as ContentType,
      fieldKey: dto.fieldKey,
      fieldType: dto.fieldType,
      label: dto.label ?? null,
      required: dto.required ?? false,
      sortOrder: dto.sortOrder ?? 0,
      showInTable: dto.showInTable ?? false,
      validation: dto.validation ?? null,
    });
    return this.fieldRepo.save(f);
  }

  async updateField(
    principal: ContentJwtUser,
    fieldId: number,
    dto: UpdateContentFieldDto,
  ): Promise<ContentFieldDefinition> {
    await this.assertSchemaManage(principal);
    const f = await this.fieldRepo.findOne({
      where: { id: fieldId },
      relations: ['contentType'],
    });
    if (!f) throw new NotFoundException('Field definition not found');
    if (dto.fieldType !== undefined) f.fieldType = dto.fieldType;
    if (dto.label !== undefined) f.label = dto.label;
    if (dto.required !== undefined) f.required = dto.required;
    if (dto.sortOrder !== undefined) f.sortOrder = dto.sortOrder;
    if (dto.showInTable !== undefined) f.showInTable = dto.showInTable;
    if (dto.validation !== undefined) f.validation = dto.validation;
    return this.fieldRepo.save(f);
  }

  async removeField(principal: ContentJwtUser, fieldId: number): Promise<void> {
    await this.assertSchemaManage(principal);
    const res = await this.fieldRepo.delete({ id: fieldId });
    if (!res.affected) throw new NotFoundException('Field definition not found');
  }

  // --- Content instances ---
  async createContent(
    principal: ContentJwtUser,
    dto: CreateContentDto,
  ): Promise<Content> {
    await this.assertModuleAccess(principal);
    const { type, fields } = await this.loadTypeWithFields(dto.contentTypeId);
    if (!type.isActive) throw new BadRequestException('Content type is inactive');

    this.assertLinkedAllowedForType(type, dto.linkedEntityType);
    await this.assertLinkedRowExists(dto.linkedEntityType, dto.linkedEntityId);

    const audienceId = dto.audienceDepartmentId ?? null;
    if (!(await this.canWriteForAudience(principal, audienceId))) {
      throw new ForbiddenException('Cannot create content for this audience');
    }

    const cleaned = this.validateFieldValues(fields, dto.fieldValues, true);
    await this.validateFieldRelations(fields, cleaned);

    const authorId = await this.resolveChoirUserIdForFk(principal);
    const row = this.contentRepo.create({
      contentType: { id: dto.contentTypeId } as ContentType,
      fieldValues: cleaned,
      linkedEntityType: dto.linkedEntityType,
      linkedEntityId: dto.linkedEntityId,
      status: ContentStatus.DRAFT,
      visibility: dto.visibility ?? ContentVisibility.PRIVATE,
      audienceDepartment: audienceId
        ? ({ id: audienceId } as Department)
        : null,
      author: authorId ? ({ id: authorId } as User) : null,
    });
    return this.contentRepo.save(row);
  }

  async updateContent(
    principal: ContentJwtUser,
    id: number,
    dto: UpdateContentDto,
  ): Promise<Content> {
    await this.assertModuleAccess(principal);
    const row = await this.contentRepo.findOne({
      where: { id },
      relations: ['contentType', 'audienceDepartment', 'author'],
    });
    if (!row) throw new NotFoundException('Content not found');

    const audienceId = row.audienceDepartment?.id ?? null;
    if (!(await this.canWriteForAudience(principal, audienceId))) {
      throw new ForbiddenException('Cannot update this content');
    }

    const { fields } = await this.loadTypeWithFields(row.contentType.id);

    if (dto.fieldValues !== undefined) {
      const merged = { ...row.fieldValues, ...dto.fieldValues };
      const cleaned = this.validateFieldValues(fields, merged, true);
      await this.validateFieldRelations(fields, cleaned);
      row.fieldValues = cleaned;
    }

    if (dto.visibility !== undefined) row.visibility = dto.visibility;
    if (dto.audienceDepartmentId !== undefined) {
      const next = dto.audienceDepartmentId ?? null;
      if (!(await this.canWriteForAudience(principal, next))) {
        throw new ForbiddenException('Cannot assign this audience');
      }
      row.audienceDepartment = next ? ({ id: next } as Department) : null;
    }

    if (dto.status !== undefined) {
      this.assertStatusTransition(row.status, dto.status);
      if (dto.status === ContentStatus.PUBLISHED) {
        throw new ForbiddenException('Use publish endpoint to set published');
      }
      row.status = dto.status;
    }

    return this.contentRepo.save(row);
  }

  private assertStatusTransition(from: ContentStatus, to: ContentStatus) {
    if (from === to) return;
    if (from === ContentStatus.PUBLISHED) {
      throw new BadRequestException('Published content cannot change status here');
    }
    if (to === ContentStatus.PUBLISHED) {
      throw new BadRequestException('Use publish endpoint');
    }
    const ok =
      (from === ContentStatus.DRAFT && to === ContentStatus.READY) ||
      (from === ContentStatus.READY && to === ContentStatus.DRAFT) ||
      (from === ContentStatus.READY && to === ContentStatus.READY);
    if (!ok) {
      throw new BadRequestException('Invalid status transition');
    }
  }

  async approve(principal: ContentJwtUser, id: number): Promise<Content> {
    await this.assertModuleAccess(principal);
    const row = await this.contentRepo.findOne({
      where: { id },
      relations: ['audienceDepartment', 'author'],
    });
    if (!row) throw new NotFoundException('Content not found');
    const audienceId = row.audienceDepartment?.id ?? null;
    if (!(await this.canApproveForAudience(principal, audienceId))) {
      throw new ForbiddenException('Cannot approve this content');
    }
    const approverId = await this.resolveChoirUserIdForFk(principal);
    row.approvedBy = approverId ? ({ id: approverId } as User) : null;
    row.approvedAt = new Date();
    return this.contentRepo.save(row);
  }

  async publish(principal: ContentJwtUser, id: number): Promise<Content> {
    await this.assertModuleAccess(principal);
    if (!isAdminCmsUser(principal)) {
      const userId = this.choirUserIdForRbac(principal);
      const codes = await this.rbac.getAllPermissionCodesFlat(userId);
      if (!codes.has(PERMISSION_CODES.GLOBAL_PUBLISHER)) {
        throw new ForbiddenException('Only publishers can publish');
      }
    }
    const row = await this.contentRepo.findOne({
      where: { id },
      relations: ['audienceDepartment', 'author'],
    });
    if (!row) throw new NotFoundException('Content not found');
    if (!row.approvedAt) {
      throw new BadRequestException('Content must be approved before publishing');
    }
    row.status = ContentStatus.PUBLISHED;
    row.publishedAt = new Date();
    return this.contentRepo.save(row);
  }

  async findAllContents(
    principal: ContentJwtUser,
    query: ListContentQueryDto,
  ): Promise<PaginatedContents> {
    await this.assertModuleAccess(principal);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = this.contentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.contentType', 'ct')
      .leftJoinAndSelect('c.audienceDepartment', 'aud')
      .leftJoinAndSelect('c.author', 'author');

    if (query.contentTypeId != null) {
      qb.andWhere('c.contentTypeId = :tid', { tid: query.contentTypeId });
    }
    if (query.status != null) {
      qb.andWhere('c.status = :st', { st: query.status });
    }
    if (query.visibility != null) {
      qb.andWhere('c.visibility = :vis', { vis: query.visibility });
    }
    if (query.audienceDepartmentId != null) {
      qb.andWhere('c.audienceDepartmentId = :aid', {
        aid: query.audienceDepartmentId,
      });
    }
    if (query.linkedEntityType != null && query.linkedEntityId != null) {
      qb.andWhere('c.linkedEntityType = :let', { let: query.linkedEntityType });
      qb.andWhere('c.linkedEntityId = :lei', { lei: query.linkedEntityId });
    }

    if (query.search?.trim()) {
      const esc = query.search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      qb.andWhere(`c."fieldValues"::text ILIKE :search ESCAPE '\\'`, {
        search: `%${esc}%`,
      });
    }

    const sortKeyRaw = query.sortBy?.trim();
    const dir =
      query.sortDir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const isColumnSort =
      sortKeyRaw === 'updatedAt' ||
      sortKeyRaw === 'id' ||
      sortKeyRaw === 'status' ||
      sortKeyRaw === 'visibility';
    const jsonSortKey =
      sortKeyRaw &&
      /^[a-zA-Z0-9_]+$/.test(sortKeyRaw) &&
      !isColumnSort
        ? sortKeyRaw
        : null;

    if (isColumnSort && sortKeyRaw) {
      qb.orderBy(`c.${sortKeyRaw}`, dir).addOrderBy('c.id', 'DESC');
    } else if (jsonSortKey) {
      qb.orderBy(`c."fieldValues"->>'${jsonSortKey}'`, dir).addOrderBy(
        'c.updatedAt',
        'DESC',
      );
    } else {
      qb.orderBy('c.updatedAt', 'DESC');
    }

    qb.skip(skip).take(limit);
    const [rows, total] = await qb.getManyAndCount();

    if (isAdminCmsUser(principal)) {
      return { items: rows, total, page, limit };
    }

    const items: Content[] = [];
    for (const r of rows) {
      if (await this.canReadContentRow(principal, r)) {
        items.push(r);
      }
    }
    return { items, total, page, limit };
  }

  async findOneContent(
    principal: ContentJwtUser,
    id: number,
  ): Promise<Content> {
    await this.assertModuleAccess(principal);
    const row = await this.contentRepo.findOne({
      where: { id },
      relations: [
        'contentType',
        'audienceDepartment',
        'author',
        'approvedBy',
      ],
    });
    if (!row) throw new NotFoundException('Content not found');
    if (!(await this.canReadContentRow(principal, row))) {
      throw new ForbiddenException('Cannot read this content');
    }
    return row;
  }
}
