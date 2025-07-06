import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './song.entity';
import { SongService } from './song.service';
import { SongController } from './song.controller';
import { User } from '../users/user.entity';
import { AdminUser } from '../admin/admin_users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, User, AdminUser])],
  providers: [SongService],
  controllers: [SongController],
})
export class SongModule {} 