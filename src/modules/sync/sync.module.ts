import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncLog } from './sync.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SyncLog])],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService]
})
export class SyncModule {} 