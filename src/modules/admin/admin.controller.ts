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
    UseGuards
} from '@nestjs/common';
import { AdminUsersService } from './admin_users.service';
import { CreateAdminDto, UpdateAdminDto } from '../../common/dtos/admin.dto';
import { AdminUser } from './admin_users.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from './admin-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(private readonly adminService: AdminUsersService) {}

    @Post('create')
    @Roles(AdminRole.SUPER_ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createAdmin(
        @Body() adminData: CreateAdminDto
    ) {
        return this.adminService.createAdmin(adminData);
    }

    @Get('all')
    @Roles(AdminRole.SUPER_ADMIN)
    async getAllAdmins() {
        return this.adminService.getAllAdmins();
    }

    @Put(':id')
    @Roles(AdminRole.SUPER_ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateAdmin(
        @Param('id') id: string,
        @Body() updateData: UpdateAdminDto
    ) {
        return this.adminService.updateAdmin(parseInt(id), updateData);
    }

    @Delete(':id')
    @Roles(AdminRole.SUPER_ADMIN)
    async deactivateAdmin(
        @Param('id') id: string
    ) {
        await this.adminService.deactivateAdmin(parseInt(id));
        return { message: 'Admin deactivated successfully' };
    }
} 