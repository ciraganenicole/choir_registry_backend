import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { SyncLog, SyncEntityType, SyncOperation } from './sync.entity';

@Injectable()
export class SyncService {
    constructor(
        @InjectRepository(SyncLog)
        private syncLogRepository: Repository<SyncLog>
    ) {}

    async logChange(
        entityType: SyncEntityType,
        entityId: number,
        operation: SyncOperation,
        changes: Record<string, any>
    ): Promise<SyncLog> {
        const syncLog = this.syncLogRepository.create({
            entityType,
            entityId,
            operation,
            changes,
            syncTimestamp: new Date(),
            isSynced: false
        });

        return this.syncLogRepository.save(syncLog);
    }

    async getChangesSince(lastSyncTimestamp: Date): Promise<SyncLog[]> {
        return this.syncLogRepository.find({
            where: {
                syncTimestamp: MoreThan(lastSyncTimestamp)
            },
            order: {
                syncTimestamp: 'ASC'
            }
        });
    }

    async markAsSynced(syncLogIds: number[]): Promise<void> {
        await this.syncLogRepository.update(
            { id: In(syncLogIds) },
            { isSynced: true }
        );
    }

    async getPendingChanges(): Promise<SyncLog[]> {
        return this.syncLogRepository.find({
            where: { isSynced: false },
            order: { syncTimestamp: 'ASC' }
        });
    }
} 