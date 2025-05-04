import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SyncEntityType {
    USER = 'user',
    ATTENDANCE = 'attendance',
    TRANSACTION = 'transaction'
}

export enum SyncOperation {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}

@Entity('sync_logs')
export class SyncLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: SyncEntityType
    })
    entityType: SyncEntityType;

    @Column()
    entityId: number;

    @Column({
        type: 'enum',
        enum: SyncOperation
    })
    operation: SyncOperation;

    @Column('jsonb')
    changes: Record<string, any>;

    @Column('timestamp')
    syncTimestamp: Date;

    @Column({ default: false })
    isSynced: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 