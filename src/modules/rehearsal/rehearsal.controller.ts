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
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RehearsalService } from './rehearsal.service';
import { CreateRehearsalDto } from './dto/create-rehearsal.dto';
import { CreateRehearsalSongDto } from './dto/create-rehearsal-song.dto';
import { UpdateRehearsalSongDto } from './dto/update-rehearsal-song.dto';
import { UpdateRehearsalDto } from './dto/update-rehearsal.dto';
import { RehearsalFilterDto } from './dto/rehearsal-filter.dto';
import { Rehearsal, RehearsalType, RehearsalStatus } from './rehearsal.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Rehearsals')
@Controller('rehearsals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RehearsalController {
  constructor(private readonly rehearsalService: RehearsalService) {}

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Create a new rehearsal with multiple songs' })
  @ApiResponse({ status: 201, description: 'Rehearsal created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or LEAD user not on active shift' })
  async create(
    @Body() createRehearsalDto: CreateRehearsalDto,
    @CurrentUser() user: any
  ): Promise<Rehearsal> {
    return this.rehearsalService.create(createRehearsalDto, user.id, user.type, user.role);
  }

  @Get()
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all rehearsals with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of rehearsals' })
  async findAll(@Query() filterDto: RehearsalFilterDto): Promise<[Rehearsal[], number]> {
    return this.rehearsalService.findAll(filterDto);
  }

  @Get('stats')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get rehearsal statistics' })
  @ApiResponse({ status: 200, description: 'Rehearsal statistics' })
  async getStats() {
    return this.rehearsalService.getStats();
  }

  @Get('templates')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all rehearsal templates' })
  @ApiResponse({ status: 200, description: 'List of rehearsal templates' })
  async getTemplates(): Promise<Rehearsal[]> {
    return this.rehearsalService.getTemplates();
  }

  @Get('my-rehearsals')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get rehearsals for current user' })
  @ApiResponse({ status: 200, description: 'User rehearsals' })
  async findMyRehearsals(@CurrentUser() user: any): Promise<Rehearsal[]> {
    return this.rehearsalService.findByUser(user.id);
  }

  @Get('by-song/:songId')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get rehearsals that contain a specific song' })
  @ApiResponse({ status: 200, description: 'Song rehearsals' })
  async findBySong(@Param('songId', ParseIntPipe) songId: number): Promise<Rehearsal[]> {
    return this.rehearsalService.findBySong(songId);
  }

  @Get('debug/all')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Debug endpoint - Get all rehearsals without filters' })
  @ApiResponse({ status: 200, description: 'All rehearsals for debugging' })
  async getAllRehearsalsDebug(): Promise<Rehearsal[]> {
    return this.rehearsalService.getAllRehearsalsDebug();
  }

  @Get('debug/raw')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Debug endpoint - Get raw rehearsal data from database' })
  @ApiResponse({ status: 200, description: 'Raw rehearsal data for debugging' })
  async getRawRehearsalsDebug(): Promise<any[]> {
    return this.rehearsalService.getRawRehearsalsDebug();
  }

  @Get(':id/songs')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get rehearsal songs with clear separation of song library and rehearsal data' })
  @ApiResponse({ status: 200, description: 'Rehearsal songs with clear context' })
  @ApiResponse({ status: 404, description: 'Rehearsal not found' })
  async getRehearsalSongs(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rehearsalService.getRehearsalSongs(id);
  }

  @Get(':id/promotion-readiness')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Check if rehearsal can be promoted to performance' })
  @ApiResponse({ status: 200, description: 'Promotion readiness status and requirements' })
  @ApiResponse({ status: 404, description: 'Rehearsal not found' })
  async checkPromotionReadiness(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rehearsalService.checkPromotionReadiness(id);
  }

  @Post(':id/songs')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Add songs to an existing rehearsal' })
  @ApiResponse({ status: 200, description: 'Songs added to rehearsal successfully' })
  @ApiResponse({ status: 404, description: 'Rehearsal not found' })
  async addSongsToRehearsal(
    @Param('id', ParseIntPipe) id: number,
    @Body() songsData: any, // More flexible to handle different formats
    @CurrentUser() user: any
  ): Promise<Rehearsal> {
    
    // Handle different possible request body formats
    let rehearsalSongs: CreateRehearsalSongDto[];
    
    if (songsData.rehearsalSongs && Array.isArray(songsData.rehearsalSongs)) {
      rehearsalSongs = songsData.rehearsalSongs;
    } else if (Array.isArray(songsData)) {
      rehearsalSongs = songsData;
    } else if (songsData.songs && Array.isArray(songsData.songs)) {
      rehearsalSongs = songsData.songs;
    } else if (songsData.songData) {
      rehearsalSongs = [songsData.songData];
    } else if (songsData.songId || songsData.difficulty || songsData.musicians) {
      rehearsalSongs = [songsData];
    } else {
      throw new BadRequestException('Request body must contain a valid array of songs. Expected formats: { rehearsalSongs: [...] }, [...], { songs: [...] }, { songData: {...} }, or direct song object');
    }
    
    return this.rehearsalService.addSongsToRehearsal(id, rehearsalSongs, user.id, user.type, user.role);
  }

  @Patch(':id/songs/:songId')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ 
    summary: 'Update rehearsal-specific properties of a song',
    description: 'Updates rehearsal song properties like difficulty, musicians, voice parts, lead singers, musical key, etc. The actual song (songId) cannot be changed.'
  })
  @ApiResponse({ status: 200, description: 'Rehearsal song updated successfully' })
  @ApiResponse({ status: 404, description: 'Rehearsal or song not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateRehearsalSong(
    @Param('id', ParseIntPipe) rehearsalId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() updateData: UpdateRehearsalSongDto,
    @CurrentUser() user: any
  ): Promise<Rehearsal> {
    return this.rehearsalService.updateRehearsalSong(rehearsalId, songId, updateData, user.id, user.type, user.role);
  }

  @Delete(':id/songs/:songId')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Remove a specific song from a rehearsal' })
  @ApiResponse({ status: 200, description: 'Song removed from rehearsal successfully' })
  @ApiResponse({ status: 404, description: 'Rehearsal or song not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async removeRehearsalSong(
    @Param('id', ParseIntPipe) rehearsalId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @CurrentUser() user: any
  ): Promise<Rehearsal> {
    return this.rehearsalService.removeRehearsalSong(rehearsalId, songId, user.id, user.type, user.role);
  }

  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get a specific rehearsal by ID' })
  @ApiResponse({ status: 200, description: 'Rehearsal found' })
  @ApiResponse({ status: 404, description: 'Rehearsal not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Rehearsal> {
    return this.rehearsalService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Update a rehearsal' })
  @ApiResponse({ status: 200, description: 'Rehearsal updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions, not on active shift, or not the creator' })
  @ApiResponse({ status: 404, description: 'Rehearsal not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRehearsalDto: UpdateRehearsalDto,
    @CurrentUser() user: any
  ): Promise<Rehearsal> {
    return this.rehearsalService.update(id, updateRehearsalDto, user.id, user.type, user.role);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Delete a rehearsal' })
  @ApiResponse({ status: 200, description: 'Rehearsal deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions, not on active shift, or not the creator' })
  @ApiResponse({ status: 404, description: 'Rehearsal not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ): Promise<void> {
    return this.rehearsalService.remove(id, user.id, user.type, user.role);
  }

  @Post('from-template/:templateId')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Create a new rehearsal from a template' })
  @ApiResponse({ status: 201, description: 'Rehearsal created from template successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - template not found or not a template' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async copyFromTemplate(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() copyData: { newDate: string; title: string },
    @CurrentUser() user: any
  ): Promise<Rehearsal> {
    return this.rehearsalService.copyFromTemplate(templateId, copyData.newDate, copyData.title, user.id);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all available rehearsal types' })
  @ApiResponse({ status: 200, description: 'List of rehearsal types' })
  async getRehearsalTypes() {
    return Object.values(RehearsalType);
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get all available rehearsal statuses' })
  @ApiResponse({ status: 200, description: 'List of rehearsal statuses' })
  async getRehearsalStatuses() {
    return Object.values(RehearsalStatus);
  }
}
