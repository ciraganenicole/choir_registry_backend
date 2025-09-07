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
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { PerformanceFilterDto } from './dto/performance-filter.dto';
import { Performance, PerformanceType } from './performance.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Performances')
@Controller('performances')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Create a new performance with multiple songs' })
  @ApiResponse({ status: 201, description: 'Performance created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or LEAD user not on active shift' })
  async create(
    @Body() createPerformanceDto: CreatePerformanceDto,
    @CurrentUser() user: any
  ): Promise<Performance> {
    return this.performanceService.create(createPerformanceDto, user.id, user.type, user.role);
  }

  @Get()
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all performances with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of performances' })
  async findAll(@Query() filterDto: PerformanceFilterDto): Promise<[Performance[], number]> {
    return this.performanceService.findAll(filterDto);
  }

  @Get('stats')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get performance statistics' })
  @ApiResponse({ status: 200, description: 'Performance statistics' })
  async getStats() {
    return this.performanceService.getStats();
  }

  @Get('my-performances')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get performances for current user' })
  @ApiResponse({ status: 200, description: 'User performances' })
  async findMyPerformances(@CurrentUser() user: any): Promise<Performance[]> {
    return this.performanceService.findByUser(user.id);
  }

  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get a specific performance by ID' })
  @ApiResponse({ status: 200, description: 'Performance found' })
  @ApiResponse({ status: 404, description: 'Performance not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Performance> {
    return this.performanceService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Update a performance' })
  @ApiResponse({ status: 200, description: 'Performance updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions, not on active shift, or not the creator' })
  @ApiResponse({ status: 404, description: 'Performance not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePerformanceDto: UpdatePerformanceDto,
    @CurrentUser() user: any
  ): Promise<Performance> {
    return this.performanceService.update(id, updatePerformanceDto, user.id, user.type, user.role);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Delete a performance' })
  @ApiResponse({ status: 200, description: 'Performance deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or not on active shift' })
  @ApiResponse({ status: 404, description: 'Performance not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ): Promise<void> {
    return this.performanceService.remove(id, user.id, user.type, user.role);
  }

  @Post(':id/promote-rehearsal/:rehearsalId')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Promote a rehearsal to populate performance with detailed data' })
  @ApiResponse({ status: 200, description: 'Rehearsal promoted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - performance not in preparation status' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or not on active shift' })
  @ApiResponse({ status: 404, description: 'Performance or rehearsal not found' })
  async promoteRehearsal(
    @Param('id', ParseIntPipe) performanceId: number,
    @Param('rehearsalId', ParseIntPipe) rehearsalId: number,
    @CurrentUser() user: any
  ): Promise<Performance> {
    return this.performanceService.promoteRehearsal(performanceId, rehearsalId, user.id, user.type, user.role);
  }

  @Post(':id/mark-in-preparation')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Mark performance as in preparation (ready for rehearsals)' })
  @ApiResponse({ status: 200, description: 'Performance marked as in preparation' })
  @ApiResponse({ status: 400, description: 'Bad request - performance not in upcoming status' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or not on active shift' })
  @ApiResponse({ status: 404, description: 'Performance not found' })
  async markInPreparation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ): Promise<Performance> {
    return this.performanceService.markInPreparation(id, user.id, user.type, user.role);
  }

  @Post(':id/mark-completed')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Mark performance as completed' })
  @ApiResponse({ status: 200, description: 'Performance marked as completed' })
  @ApiResponse({ status: 400, description: 'Bad request - performance not in ready status' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or not on active shift' })
  @ApiResponse({ status: 404, description: 'Performance not found' })
  async markCompleted(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ): Promise<Performance> {
    return this.performanceService.markCompleted(id, user.id, user.type, user.role);
  }

  @Get('types')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all performance types' })
  @ApiResponse({ status: 200, description: 'List of performance types' })
  async getPerformanceTypes() {
    return Object.values(PerformanceType);
  }

  @Get('instruments')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all available instruments' })
  @ApiResponse({ status: 200, description: 'List of available instruments' })
  async getInstruments() {
    // Return the instrument list as strings
    return [
      // Keyboard Instruments
      'Piano', 'Organ', 'Keyboard', 'Synthesizer', 'Accordion',
      // String Instruments
      'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Bass', 'Bass Guitar',
      'Violin', 'Viola', 'Cello', 'Double Bass', 'Harp', 'Mandolin', 'Ukulele',
      // Wind Instruments
      'Flute', 'Piccolo', 'Clarinet', 'Oboe', 'Bassoon', 'Trumpet', 'Trombone',
      'French Horn', 'Saxophone', 'Alto Saxophone', 'Tenor Saxophone', 'Baritone Saxophone',
      'Euphonium', 'Tuba',
      // Percussion Instruments
      'Drums', 'Drum Kit', 'Snare Drum', 'Bass Drum', 'Cymbals',
      'Tambourine', 'Maracas', 'Congas', 'Bongos', 'Timpani', 'Xylophone', 'Glockenspiel',
      'Chimes', 'Bells',
      // Other Instruments
      'Harmonica', 'Kalimba', 'Recorder', 'Pan Flute', 'Didgeridoo',
      // Custom/Other
      'Other',
    ];
  }
} 