import { Injectable, ConflictException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { Choir } from './choir.entity';
import { CreateChoirDto } from '../../common/dtos/choir.dto';
import { BaseService } from '../../common/services/base.service';
import { ChoirContext } from '../../common/decorators/choir-context.decorator';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/role.enum';
import { UsersService } from '../users/users.service';

interface FindAllOptions {
    search?: string;
    country?: string;
    city?: string;
}

@Injectable()
export class ChoirService extends BaseService<Choir> {
    private readonly logger = new Logger(ChoirService.name);

    constructor(
        @InjectRepository(Choir)
        private choirRepository: Repository<Choir>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private usersService: UsersService
    ) {
        super(choirRepository);
    }

    async create(createChoirDto: CreateChoirDto, choirContext: ChoirContext, adminId: string): Promise<Choir> {
        const existingChoir = await this.choirRepository.findOne({
            where: [
                { name: createChoirDto.name },
                { contactEmail: createChoirDto.contactEmail }
            ]
        });

        if (existingChoir) {
            throw new ConflictException('A choir with this name or contact email already exists');
        }

        // Create the choir
        const choir = await this.createWithChoirFilter(createChoirDto, choirContext);

        // Update the admin user with the choir reference
        await this.usersService.updateUser(adminId, { choirId: choir.id } as any);

        return choir;
    }

    async createChoirForAdmin(choirData: CreateChoirDto, adminId: string) {
        // Get the admin user and verify it's a CHOIR_ADMIN
        const admin = await this.usersService.findById(adminId);
        if (!admin) {
            throw new NotFoundException('Admin user not found');
        }

        if (admin.role !== UserRole.CHOIR_ADMIN) {
            throw new UnauthorizedException('User is not a choir admin');
        }

        if (admin.choirId) {
            throw new ConflictException('Admin is already associated with a choir');
        }

        // Create choir with super admin context to bypass choir filter
        const choir = await this.create(choirData, { choirId: '', role: UserRole.SUPER_ADMIN }, adminId);

        // Update admin with choir reference
        await this.usersService.updateUser(adminId, { choirId: choir.id } as any);

        return choir;
    }

    async findAll(options: FindAllOptions = {}, choirContext: ChoirContext): Promise<Choir[]> {
        const { search, country, city } = options;
        const queryBuilder = this.choirRepository.createQueryBuilder('choir');
        this.applyChoirFilter(queryBuilder, choirContext);

        if (search) {
            queryBuilder.where(
                '(choir.name ILIKE :search OR choir.church ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (country) {
            queryBuilder.andWhere('choir.country = :country', { country });
        }

        if (city) {
            queryBuilder.andWhere('choir.city = :city', { city });
        }

        return await queryBuilder.getMany();
    }

    async findById(id: string, choirContext: ChoirContext): Promise<Choir> {
        return this.findOneWithChoirFilter(id, choirContext);
    }

    async findBySlug(slug: string, choirContext: ChoirContext): Promise<Choir> {
        const queryBuilder = this.choirRepository.createQueryBuilder('choir');
        this.applyChoirFilter(queryBuilder, choirContext);
        queryBuilder.where('choir.slug = :slug', { slug });

        const choir = await queryBuilder.getOne();
        if (!choir) {
            throw new NotFoundException(`Choir with slug ${slug} not found`);
        }
        return choir;
    }

    async update(id: string, updateChoirDto: Partial<CreateChoirDto>, choirContext: ChoirContext): Promise<Choir> {
        const choir = await this.findById(id, choirContext);

        // Check if name or email is being changed and if it conflicts with existing records
        if (updateChoirDto.name && updateChoirDto.name !== choir.name || 
            updateChoirDto.contactEmail && updateChoirDto.contactEmail !== choir.contactEmail) {
            const existingChoir = await this.choirRepository.findOne({
                where: [
                    { name: updateChoirDto.name, id: Not(id) },
                    { contactEmail: updateChoirDto.contactEmail, id: Not(id) }
                ]
            });

            if (existingChoir) {
                throw new ConflictException('A choir with this name or contact email already exists');
            }
        }

        return this.updateWithChoirFilter(id, updateChoirDto, choirContext);
    }

    async remove(id: string, choirContext: ChoirContext): Promise<void> {
        return this.removeWithChoirFilter(id, choirContext);
    }

    async updateMemberRole(memberId: string, role: UserRole, choirContext: ChoirContext): Promise<User> {
        // Verify the member belongs to the choir
        const member = await this.userRepository.findOne({
            where: { id: memberId, choirId: choirContext.choirId }
        });

        if (!member) {
            throw new NotFoundException('Member not found in your choir');
        }

        // Update the member's role
        member.role = role;
        return this.userRepository.save(member);
    }

    async getChoirMembers(choirContext: ChoirContext): Promise<User[]> {
        return this.userRepository.find({
            where: { choirId: choirContext.choirId },
            order: { createdAt: 'DESC' }
        });
    }
} 