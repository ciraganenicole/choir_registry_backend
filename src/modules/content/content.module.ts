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
import { UsersModule } from '../users/users.module';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentType, ContentFieldDefinition, Content, Song]),
    UsersModule,
    GuardsModule,
  ],
  providers: [ContentService, PublicContentService, ContentLinkedStubService],
  controllers: [ContentController, PublicContentController],
  exports: [ContentService],
})
export class ContentModule {}
