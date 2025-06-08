import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { ChoirContext } from '../decorators/choir-context.decorator';
import { UserRole } from '../../modules/users/enums/role.enum';

export abstract class BaseService<T extends ObjectLiteral> {
    constructor(
        protected readonly repository: Repository<T>
    ) {}

    protected applyChoirFilter(queryBuilder: SelectQueryBuilder<T>, choirContext: ChoirContext): SelectQueryBuilder<T> {
        // SUPER_ADMIN has access to all data
        if (choirContext.role === UserRole.SUPER_ADMIN) {
            return queryBuilder;
        }

        // CHOIR_ADMIN can only access their own choir's data
        if (choirContext.role === UserRole.CHOIR_ADMIN) {
            queryBuilder.andWhere(`${queryBuilder.alias}.choirId = :choirId`, {
                choirId: choirContext.choirId
            });
        }

        return queryBuilder;
    }

    protected async findOneWithChoirFilter(id: string, choirContext: ChoirContext): Promise<T> {
        const queryBuilder = this.repository.createQueryBuilder(this.repository.metadata.name);
        this.applyChoirFilter(queryBuilder, choirContext);
        queryBuilder.where(`${queryBuilder.alias}.id = :id`, { id });
        
        const entity = await queryBuilder.getOne();
        if (!entity) {
            throw new Error('Entity not found');
        }
        return entity;
    }

    protected async findAllWithChoirFilter(choirContext: ChoirContext): Promise<T[]> {
        const queryBuilder = this.repository.createQueryBuilder(this.repository.metadata.name);
        this.applyChoirFilter(queryBuilder, choirContext);
        return queryBuilder.getMany();
    }

    protected async createWithChoirFilter(entity: Partial<T>, choirContext: ChoirContext): Promise<T> {
        const newEntity = this.repository.create({
            ...entity,
            choirId: choirContext.choirId
        } as unknown as T);
        return this.repository.save(newEntity);
    }

    protected async updateWithChoirFilter(id: string, entity: Partial<T>, choirContext: ChoirContext): Promise<T> {
        await this.findOneWithChoirFilter(id, choirContext);
        await this.repository.update(id, entity as any);
        return this.findOneWithChoirFilter(id, choirContext);
    }

    protected async removeWithChoirFilter(id: string, choirContext: ChoirContext): Promise<void> {
        await this.findOneWithChoirFilter(id, choirContext);
        await this.repository.delete(id);
    }
} 