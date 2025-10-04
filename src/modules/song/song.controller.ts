import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SongService } from './song.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongFilterDto } from './dto/song-filter.dto';
import { SongStatus, SongDifficulty } from './song.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SongResponseDto } from './dto/song-response.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';

@Controller('songs')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async create(@Body() createSongDto: CreateSongDto, @CurrentUser() user: any): Promise<SongResponseDto> {
    const song = await this.songService.create(createSongDto, user.id);
    return SongResponseDto.fromEntity(song);
  }

  @Post('test-create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async testCreate(@Body() createSongDto: CreateSongDto, @CurrentUser() user: any): Promise<any> {
    try {
      const song = await this.songService.create(createSongDto, user.id);
      return {
        success: true,
        message: 'Song created successfully',
        song: {
          id: song.id,
          title: song.title,
          composer: song.composer,
          genre: song.genre,
          difficulty: song.difficulty,
          status: song.status,
          addedById: song.addedById,
          created_at: song.created_at
        },
        user: {
          id: user.id,
          type: user.type,
          role: user.role,
          categories: user.categories
        }
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        user: {
          id: user.id,
          type: user.type,
          role: user.role,
          categories: user.categories
        }
      };
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async findAll(@Query() filterDto: SongFilterDto): Promise<PaginatedResponseDto<SongResponseDto>> {
    const paginatedSongs = await this.songService.findAll(filterDto);
    return new PaginatedResponseDto<SongResponseDto>(
      SongResponseDto.fromEntities(paginatedSongs.data),
      paginatedSongs.meta.page,
      paginatedSongs.meta.limit,
      paginatedSongs.meta.total
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async findAllWithoutPagination(
    @Query('genre') genre?: string,
    @Query('difficulty') difficulty?: SongDifficulty,
    @Query('status') status?: SongStatus,
    @Query('search') search?: string,
  ): Promise<SongResponseDto[]> {
    const songs = await this.songService.findAllWithoutPagination({
      genre,
      difficulty,
      status,
      search,
    });
    return SongResponseDto.fromEntities(songs);
  }

  @Get('by-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<SongResponseDto[]> {
    const songs = await this.songService.findByUser(userId);
    return SongResponseDto.fromEntities(songs);
  }

  @Get('my-songs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async findMySongs(@CurrentUser() user: any): Promise<SongResponseDto[]> {
    const songs = await this.songService.findByUser(user.id);
    return SongResponseDto.fromEntities(songs);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async getMyPermissions(@CurrentUser() user: any): Promise<any> {
    return this.songService.getUserPermissions(user.id);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async getStats(): Promise<any> {
    return this.songService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SongResponseDto> {
    const song = await this.songService.findOne(id);
    return SongResponseDto.fromEntity(song);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: UpdateSongDto,
    @CurrentUser() user: any
  ): Promise<SongResponseDto> {
    const song = await this.songService.update(id, updateSongDto, user.id);
    return SongResponseDto.fromEntity(song);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any): Promise<void> {
    await this.songService.remove(id, user.id);
  }

  @Post(':id/perform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async incrementPerformance(@Param('id', ParseIntPipe) id: number): Promise<SongResponseDto> {
    const song = await this.songService.incrementPerformanceCount(id);
    return SongResponseDto.fromEntity(song);
  }

  @Patch('bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  async bulkUpdateStatus(
    @Body() body: { songIds: number[]; status: SongStatus },
    @CurrentUser() user: any
  ): Promise<void> {
    return this.songService.bulkUpdateStatus(body.songIds, body.status, user.id);
  }
} 