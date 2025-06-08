import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    ValidationPipe,
    UsePipes,
    Query,
    ParseUUIDPipe,
    ForbiddenException,
    Patch,
    Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChoirService } from './choir.service';
import { CreateChoirDto } from '../../common/dtos/choir.dto';
import { UpdateChoirMemberRoleDto } from '../../common/dtos/choir-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/role.enum';
import { ChoirContext } from '../../common/decorators/choir-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Choirs')
@Controller('choirs')
@ApiBearerAuth()
export class ChoirController {
    private readonly logger = new Logger(ChoirController.name);

    constructor(private readonly choirService: ChoirService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CHOIR_ADMIN)
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new choir (Choir Admin only)' })
    @ApiResponse({ status: 201, description: 'Choir created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Choir with this name or slug already exists' })
    async create(
        @Body() createChoirDto: CreateChoirDto,
        @ChoirContext() choirContext: ChoirContext,
        @CurrentUser() user: any
    ) {
        // Check if choir admin already has a choir
        if (choirContext.choirId) {
            throw new ForbiddenException('You already have a choir assigned');
        }
        return this.choirService.create(createChoirDto, choirContext, user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @Get()
    @ApiOperation({ summary: 'Get all choirs (Super Admin only)' })
    @ApiResponse({ status: 200, description: 'Returns list of choirs' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by name or church' })
    @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
    @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
    async findAll(
        @ChoirContext() choirContext: ChoirContext,
        @Query('search') search?: string,
        @Query('country') country?: string,
        @Query('city') city?: string
    ) {
        return this.choirService.findAll({ search, country, city }, choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.CHOIR_ADMIN)
    @Get(':id')
    @ApiOperation({ summary: 'Get choir by ID' })
    @ApiResponse({ status: 200, description: 'Returns choir details' })
    @ApiResponse({ status: 404, description: 'Choir not found' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @ChoirContext() choirContext: ChoirContext
    ) {
        // If choir admin, verify they're accessing their own choir
        if (choirContext.role === UserRole.CHOIR_ADMIN && id !== choirContext.choirId) {
            throw new ForbiddenException('You can only view your own choir');
        }
        return this.choirService.findById(id, choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.CHOIR_ADMIN)
    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get choir by slug' })
    @ApiResponse({ status: 200, description: 'Returns choir details' })
    @ApiResponse({ status: 404, description: 'Choir not found' })
    async findBySlug(
        @Param('slug') slug: string,
        @ChoirContext() choirContext: ChoirContext
    ) {
        const choir = await this.choirService.findBySlug(slug, choirContext);
        // If choir admin, verify they're accessing their own choir
        if (choirContext.role === UserRole.CHOIR_ADMIN && choir.id !== choirContext.choirId) {
            throw new ForbiddenException('You can only view your own choir');
        }
        return choir;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CHOIR_ADMIN)
    @Put(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Update choir details (Choir Admin only)' })
    @ApiResponse({ status: 200, description: 'Choir updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'Choir not found' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateChoirDto: CreateChoirDto,
        @ChoirContext() choirContext: ChoirContext
    ) {
        // Verify choir admin is updating their own choir
        if (id !== choirContext.choirId) {
            throw new ForbiddenException('You can only update your own choir');
        }
        return this.choirService.update(id, updateChoirDto, choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CHOIR_ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a choir (Choir Admin only)' })
    @ApiResponse({ status: 200, description: 'Choir deleted successfully' })
    @ApiResponse({ status: 404, description: 'Choir not found' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @ChoirContext() choirContext: ChoirContext
    ) {
        // Verify choir admin is deleting their own choir
        if (id !== choirContext.choirId) {
            throw new ForbiddenException('You can only delete your own choir');
        }
        return this.choirService.remove(id, choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CHOIR_ADMIN)
    @Get('my-choir')
    @ApiOperation({ summary: 'Get current user\'s choir details' })
    @ApiResponse({ status: 200, description: 'Returns choir details' })
    @ApiResponse({ status: 404, description: 'Choir not found' })
    async getMyChoir(@ChoirContext() choirContext: ChoirContext) {
        return this.choirService.findById(choirContext.choirId, choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CHOIR_ADMIN)
    @Put('members/:memberId/role')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Update choir member role' })
    @ApiResponse({ status: 200, description: 'Member role updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'Member not found' })
    async updateMemberRole(
        @Param('memberId', ParseUUIDPipe) memberId: string,
        @Body() updateRoleDto: UpdateChoirMemberRoleDto,
        @ChoirContext() choirContext: ChoirContext
    ) {
        return this.choirService.updateMemberRole(memberId, updateRoleDto.role, choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CHOIR_ADMIN)
    @Get('members')
    @ApiOperation({ summary: 'Get all choir members' })
    @ApiResponse({ status: 200, description: 'Returns list of choir members' })
    async getChoirMembers(@ChoirContext() choirContext: ChoirContext) {
        return this.choirService.getChoirMembers(choirContext);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @Post('admin/:adminId')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create choir for admin' })
    @ApiResponse({ status: 201, description: 'Choir created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Admin not found' })
    async createChoirForAdmin(
        @Param('adminId') adminId: string,
        @Body() choirData: CreateChoirDto,
        @CurrentUser() user: any
    ) {
        this.logger.debug(`Creating choir for admin ${adminId}`);
        return this.choirService.createChoirForAdmin(choirData, adminId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.CHOIR_ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Update choir' })
    @ApiResponse({ status: 200, description: 'Choir updated successfully' })
    @ApiResponse({ status: 404, description: 'Choir not found' })
    updateChoir(
        @Param('id') id: string,
        @Body() updateChoirDto: Partial<CreateChoirDto>,
        @ChoirContext() choirContext: ChoirContext
    ) {
        return this.choirService.update(id, updateChoirDto, choirContext);
    }
} 