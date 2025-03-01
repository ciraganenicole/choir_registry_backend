import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { AdminModule } from '../admin/admin.module';
import { Transaction } from './transactions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    UsersModule,
    AdminModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionModule {} 