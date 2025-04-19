import { 
    Controller, 
    Post, 
    Get,
    Put,
    Delete,
    Body, 
    Param,
    ValidationPipe,
    UsePipes
} from '@nestjs/common';
import { AdminUsersService } from './admin_users.service';
import { CreateAdminDto, UpdateAdminDto } from '../../common/dtos/admin.dto';
import { AdminUser } from './admin_users.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminUsersService) {}

    @Post('create')
    @UsePipes(new ValidationPipe({ transform: true }))
    async createAdmin(
        @Body() adminData: CreateAdminDto
    ) {
        return this.adminService.createAdmin(adminData);
    }

    @Get('all')
    async getAllAdmins() {
        return this.adminService.getAllAdmins();
    }

    @Put(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateAdmin(
        @Param('id') id: string,
        @Body() updateData: UpdateAdminDto
    ) {
        return this.adminService.updateAdmin(id, updateData);
    }

    @Delete(':id')
    async deactivateAdmin(
        @Param('id') id: string
    ) {
        await this.adminService.deactivateAdmin(id);
        return { message: 'Admin deactivated successfully' };
    }
} 