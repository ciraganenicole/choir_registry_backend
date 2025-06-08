import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChoirController } from './choir.controller';
import { ChoirService } from './choir.service';
import { Choir } from './choir.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Choir, User]),
        UsersModule
    ],
    controllers: [ChoirController],
    providers: [ChoirService],
    exports: [ChoirService]
})
export class ChoirModule {} 