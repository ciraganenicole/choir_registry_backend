import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Justification } from './justification.entity';
import { JustificationService } from './justification.service';
import { JustificationController } from './justification.controller';
import { AttendanceModule } from '../attendance/attendance.module';  // Correctly importing AttendanceModule

@Module({
    imports: [
      TypeOrmModule.forFeature([Justification]),
      forwardRef(() => AttendanceModule),
    ],
    providers: [JustificationService],
    controllers: [JustificationController],
    exports: [JustificationService],  // Ensure JustificationService is exported
  })
  export class JustificationModule {}
