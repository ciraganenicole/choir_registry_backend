import { 
    Controller, 
    Post, 
    Body, 
    Get,
    ValidationPipe,
    UsePipes,
    UseGuards
} from '@nestjs/common';
import { LoginDto } from '../../common/dtos/auth.dto';
import { API_ROUTES } from '../../common/routes/api.routes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';

@ApiTags('Auth')
@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Returns access token' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Post(API_ROUTES.AUTH.LOGIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post(API_ROUTES.AUTH.REFRESH)
    @UseGuards(JwtAuthGuard)
    async refreshToken(@CurrentUser() user: any) {
        return this.authService.refreshToken(user.id);
    }

    @ApiOperation({ summary: 'Get user profile' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Returns user profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Get(API_ROUTES.AUTH.PROFILE)
    @UseGuards(JwtAuthGuard)
    getProfile(@CurrentUser() user: any) {
        return user;
    }

    @Post('init-super-admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AdminRole.SUPER_ADMIN)
    async createSuperAdmin() {
        return this.authService.createInitialSuperAdmin();
    }
} 