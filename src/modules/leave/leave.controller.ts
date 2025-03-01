import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Put, 
    Delete, 
    BadRequestException,
    NotFoundException,
    ValidationPipe,
    UsePipes 
} from '@nestjs/common';
import { API_ROUTES } from '../../common/routes/api.routes';
import { CreateLeaveDto, UpdateLeaveDto } from '../../common/dtos/leave.dto';
import { LeaveService } from './leave.service';
import { Leave } from './leave.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Leave')
@ApiBearerAuth()
@Controller()
export class LeaveController {
    constructor(private readonly leaveService: LeaveService) {}

    @ApiOperation({ summary: 'Get all leave requests' })
    @ApiResponse({ status: 200, description: 'Returns all leave requests' })
    @Get(API_ROUTES.LEAVE.BASE)
    async getAllLeaves(): Promise<Leave[]> {
        return this.leaveService.findAll();
    }

    @Get(API_ROUTES.LEAVE.BY_ID)
    async getLeaveById(@Param('id') id: string): Promise<Leave> {
        const leaveId = parseInt(id, 10);
        if (isNaN(leaveId)) {
            throw new BadRequestException('Invalid leave ID');
        }
        const leave = await this.leaveService.findOne(leaveId);
        if (!leave) {
            throw new NotFoundException(`Leave with ID ${id} not found`);
        }
        return leave;
    }

    @Get(API_ROUTES.LEAVE.BY_USER)
    async getUserLeaves(@Param('userId') userId: string): Promise<Leave[]> {
        const parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId)) {
            throw new BadRequestException('Invalid user ID');
        }
        return this.leaveService.findByUser(parsedUserId);
    }

    @ApiOperation({ summary: 'Create leave request' })
    @ApiResponse({ status: 201, description: 'Leave request created' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @Post(API_ROUTES.LEAVE.BASE)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createLeave(@Body() leaveData: CreateLeaveDto): Promise<Leave> {
        return this.leaveService.create(leaveData);
    }

    @Put(API_ROUTES.LEAVE.BY_ID)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateLeave(
        @Param('id') id: string,
        @Body() leaveData: UpdateLeaveDto
    ): Promise<Leave> {
        const leaveId = parseInt(id, 10);
        if (isNaN(leaveId)) {
            throw new BadRequestException('Invalid leave ID');
        }
        return this.leaveService.update(leaveId, leaveData);
    }

    @Put(API_ROUTES.LEAVE.APPROVE)
    async approveLeave(@Param('id') id: string): Promise<Leave> {
        const leaveId = parseInt(id, 10);
        if (isNaN(leaveId)) {
            throw new BadRequestException('Invalid leave ID');
        }
        return this.leaveService.approve(leaveId);
    }

    @Put(API_ROUTES.LEAVE.REJECT)
    async rejectLeave(@Param('id') id: string): Promise<Leave> {
        const leaveId = parseInt(id, 10);
        if (isNaN(leaveId)) {
            throw new BadRequestException('Invalid leave ID');
        }
        return this.leaveService.reject(leaveId);
    }

    @Delete(API_ROUTES.LEAVE.BY_ID)
    async deleteLeave(@Param('id') id: string): Promise<{ message: string }> {
        const leaveId = parseInt(id, 10);
        if (isNaN(leaveId)) {
            throw new BadRequestException('Invalid leave ID');
        }
        await this.leaveService.remove(leaveId);
        return { message: 'Leave request deleted successfully' };
    }
} 