import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UsersModule } from '../users/users.module';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [UsersModule, GuardsModule],
  controllers: [UploadController],
})
export class UploadModule {} 