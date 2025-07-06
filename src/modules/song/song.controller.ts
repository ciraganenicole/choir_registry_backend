import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SongService } from './song.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongDifficulty, SongStatus, Song } from './song.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('songs')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.LEAD)
  async create(@Body() createSongDto: CreateSongDto, @CurrentUser() user: any): Promise<Song> {
    return this.songService.create(createSongDto, user);
  }

  @Get()
  async findAll(
    @Query('genre') genre?: string,
    @Query('difficulty') difficulty?: SongDifficulty,
    @Query('status') status?: SongStatus,
  ): Promise<Song[]> {
    return this.songService.findAll({
      genre,
      difficulty,
      status,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Song> {
    return this.songService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    return this.songService.update(id, updateSongDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.songService.remove(id);
  }
} 