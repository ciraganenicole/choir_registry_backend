import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LouadoShift } from './louado-shift.entity';
import { CreateLouadoShiftDto } from './dto/create-louado-shift.dto';
import { UpdateLouadoShiftDto } from './dto/update-louado-shift.dto';
import { LouadoShiftFilterDto } from './dto/louado-shift-filter.dto';
import { User } from '../users/user.entity';
import { UserCategory } from '../users/enums/user-category.enum';
import { CreateLouadoShiftBatchDto } from './dto/create-louado-shift-batch.dto';

@Injectable()
export class LouadoShiftService {
  constructor(
    @InjectRepository(LouadoShift)
    private readonly louadoShiftRepository: Repository<LouadoShift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async validateLouadoMember(userId: number, role: 'louange' | 'adoration'): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.categories?.includes(UserCategory.WORSHIPPER)) {
      throw new BadRequestException(
        `User with ID ${userId} is not a worshipper and cannot serve as ${role}`,
      );
    }

    return user;
  }

  private normalizeDate(date: string): Date {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date format. Please provide an ISO date string.');
    }

    // Force to UTC midnight to avoid timezone drift when persisted as DATE
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }

  async create(createLouadoShiftDto: CreateLouadoShiftDto): Promise<LouadoShift> {
    const date = this.normalizeDate(createLouadoShiftDto.date);

    const existing = await this.louadoShiftRepository.findOne({ where: { date } });
    if (existing) {
      throw new BadRequestException('A Louado shift already exists for the provided date');
    }

    await this.validateLouadoMember(createLouadoShiftDto.louangeId, 'louange');
    await this.validateLouadoMember(createLouadoShiftDto.adorationId, 'adoration');

    const louadoShift = this.louadoShiftRepository.create({
      date,
      louangeId: createLouadoShiftDto.louangeId,
      adorationId: createLouadoShiftDto.adorationId,
      notes: createLouadoShiftDto.notes,
    });

    await this.louadoShiftRepository.save(louadoShift);

    return this.findOne(louadoShift.id);
  }

  async upsertMany(batch: CreateLouadoShiftBatchDto): Promise<LouadoShift[]> {
    if (!batch.assignments?.length) {
      throw new BadRequestException('At least one assignment must be provided');
    }

    const assignments = batch.assignments.map((assignment) => ({
      ...assignment,
      date: this.normalizeDate(assignment.date),
    }));

    const dateKeys = new Set<string>();
    for (const assignment of assignments) {
      const key = assignment.date.toISOString().substring(0, 10);
      if (dateKeys.has(key)) {
        throw new BadRequestException(`Duplicate date detected in payload: ${key}`);
      }
      dateKeys.add(key);
    }

    for (const assignment of assignments) {
      await this.validateLouadoMember(assignment.louangeId, 'louange');
      await this.validateLouadoMember(assignment.adorationId, 'adoration');
    }

    const results: LouadoShift[] = [];

    for (const assignment of assignments) {
      const existing = await this.louadoShiftRepository.findOne({ where: { date: assignment.date } });

      if (existing) {
        existing.louangeId = assignment.louangeId;
        existing.adorationId = assignment.adorationId;
        existing.notes = assignment.notes;
        await this.louadoShiftRepository.save(existing);
        results.push(await this.findOne(existing.id));
      } else {
        const created = this.louadoShiftRepository.create({
          date: assignment.date,
          louangeId: assignment.louangeId,
          adorationId: assignment.adorationId,
          notes: assignment.notes,
        });
        await this.louadoShiftRepository.save(created);
        results.push(await this.findOne(created.id));
      }
    }

    return results;
  }

  async findAll(filterDto: LouadoShiftFilterDto = {}): Promise<LouadoShift[]> {
    const queryBuilder = this.louadoShiftRepository
      .createQueryBuilder('louadoShift')
      .leftJoinAndSelect('louadoShift.louange', 'louange')
      .leftJoinAndSelect('louadoShift.adoration', 'adoration')
      .orderBy('louadoShift.date', 'ASC');

    if (filterDto.startDate) {
      const startDate = this.normalizeDate(filterDto.startDate);
      queryBuilder.andWhere('louadoShift.date >= :startDate', { startDate });
    }

    if (filterDto.endDate) {
      const endDate = this.normalizeDate(filterDto.endDate);
      queryBuilder.andWhere('louadoShift.date <= :endDate', { endDate });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<LouadoShift> {
    const louadoShift = await this.louadoShiftRepository.findOne({
      where: { id },
      relations: ['louange', 'adoration'],
    });

    if (!louadoShift) {
      throw new NotFoundException(`Louado shift with ID ${id} not found`);
    }

    return louadoShift;
  }

  async update(id: number, updateLouadoShiftDto: UpdateLouadoShiftDto): Promise<LouadoShift> {
    const louadoShift = await this.louadoShiftRepository.findOne({ where: { id } });
    if (!louadoShift) {
      throw new NotFoundException(`Louado shift with ID ${id} not found`);
    }

    if (updateLouadoShiftDto.date) {
      const newDate = this.normalizeDate(updateLouadoShiftDto.date);
      const existing = await this.louadoShiftRepository.findOne({ where: { date: newDate } });

      if (existing && existing.id !== id) {
        throw new BadRequestException('Another Louado shift already exists for the provided date');
      }

      louadoShift.date = newDate;
    }

    if (updateLouadoShiftDto.louangeId !== undefined) {
      await this.validateLouadoMember(updateLouadoShiftDto.louangeId, 'louange');
      louadoShift.louangeId = updateLouadoShiftDto.louangeId;
    }

    if (updateLouadoShiftDto.adorationId !== undefined) {
      await this.validateLouadoMember(updateLouadoShiftDto.adorationId, 'adoration');
      louadoShift.adorationId = updateLouadoShiftDto.adorationId;
    }

    if (updateLouadoShiftDto.notes !== undefined) {
      louadoShift.notes = updateLouadoShiftDto.notes;
    }

    await this.louadoShiftRepository.save(louadoShift);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const louadoShift = await this.louadoShiftRepository.findOne({ where: { id } });
    if (!louadoShift) {
      throw new NotFoundException(`Louado shift with ID ${id} not found`);
    }

    await this.louadoShiftRepository.remove(louadoShift);
  }
}

