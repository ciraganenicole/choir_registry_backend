import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SyncRequestDto {
    lastSyncTimestamp: Date;
    pendingChanges: Array<{
        entityType: string;
        entityId: number;
        operation: string;
        changes: Record<string, any>;
        localId?: string;
    }>;
}

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
    constructor(private readonly syncService: SyncService) {}

    @Post()
    async synchronize(@Body() syncRequest: SyncRequestDto) {
        // Get server changes since last sync
        const serverChanges = await this.syncService.getChangesSince(
            syncRequest.lastSyncTimestamp
        );

        // Process client's pending changes
        const processedChanges = [];
        for (const change of syncRequest.pendingChanges) {
            const syncLog = await this.syncService.logChange(
                change.entityType as any,
                change.entityId,
                change.operation as any,
                change.changes
            );
            processedChanges.push({
                localId: change.localId,
                serverId: syncLog.id,
                entityId: syncLog.entityId
            });
        }

        return {
            serverChanges,
            processedChanges,
            syncTimestamp: new Date()
        };
    }
} 