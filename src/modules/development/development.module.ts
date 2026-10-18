import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevelopmentAccess, DevelopmentGuard } from './development.auth';
import { DevelopmentController } from './development.controller';
import {
  DevelopmentProfile,
  DevelopmentSector,
  DevelopmentSpecialty,
  DevelopmentSubcategory,
} from './development.entity';
import { DevelopmentService } from './development.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      DevelopmentProfile,
      DevelopmentSector,
      DevelopmentSpecialty,
      DevelopmentSubcategory,
    ]),
  ],
  controllers: [DevelopmentController],
  providers: [DevelopmentAccess, DevelopmentGuard, DevelopmentService],
})
export class DevelopmentModule {}
