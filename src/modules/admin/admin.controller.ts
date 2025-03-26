import { 
    Controller, 
    Post, 
    Get,
    Put,
    Delete,
    Body, 
    Param,
    ValidationPipe,
    UsePipes,
    BadRequestException 
} from '@nestjs/common';
import { AdminUsersService } from './admin_users.service';
import { AdminRole } from './admin-role.enum';
import { CreateAdminDto, UpdateAdminDto } from '../../common/dtos/admin.dto';
import { API_ROUTES } from '../../common/routes/api.routes';
import { AdminUser } from './admin_users.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminUsersService) {}

    @Post('create')
    @UsePipes(new ValidationPipe({ transform: true }))
    async createAdmin(
        @Body() adminData: CreateAdminDto,
        @CurrentUser() currentUser: AdminUser
    ) {
        return this.adminService.createAdmin(adminData, currentUser.role);
    }

    @Get('all')
    async getAllAdmins(@CurrentUser() currentUser: AdminUser) {
        return this.adminService.getAllAdmins(currentUser.role);
    }

    @Get('role/:role')
    async getAdminsByRole(@Param('role') role: AdminRole) {
        return this.adminService.getAdminsByRole(role);
    }

    @Put(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateAdmin(
        @Param('id') id: string,
        @Body() updateData: UpdateAdminDto,
        @CurrentUser() currentUser: AdminUser
    ) {
        return this.adminService.updateAdmin(id, updateData, currentUser.role);
    }

    @Delete(':id')
    async deactivateAdmin(
        @Param('id') id: string,
        @CurrentUser() currentUser: AdminUser
    ) {
        await this.adminService.deactivateAdmin(id, currentUser.role);
        return { message: 'Admin deactivated successfully' };
    }
} 