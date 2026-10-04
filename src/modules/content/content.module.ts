import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentType } from './content-type.entity';
import { ContentFieldDefinition } from './content-field-definition.entity';
import { Content } from './content.entity';
import { Song } from '../song/song.entity';
import { ContentService } from './content.service';
import { ContentLinkedStubService } from './content-linked-stub.service';
import { ContentController } from './content.controller';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';
import { ProgrammeGenerationService } from './programme-generation.service';
import { ProgrammeSchedulerService } from './programme-scheduler.service';
import { ProgrammeGeneration } from './programme-generation.entity';
import { Participation } from './participation.entity';
import { PushModule } from './push.module';
import { UsersModule } from '../users/users.module';
import { GuardsModule } from '../../common/guards/guards.module';
import { CommuniqueModule } from '../communiques/communique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentType,
      ContentFieldDefinition,
      Content,
      Song,
      ProgrammeGeneration,
      Participation,
    ]),
    PushModule,
    UsersModule,
    GuardsModule,
    CommuniqueModule,
  ],
  providers: [
    ContentService,
    PublicContentService,
    ContentLinkedStubService,
    ProgrammeGenerationService,
    ProgrammeSchedulerService,
  ],
  controllers: [ContentController, PublicContentController],
  exports: [ContentService, ProgrammeGenerationService],
})
export class ContentModule {}
