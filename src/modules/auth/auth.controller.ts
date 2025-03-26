import { 
    Controller, 
    Post, 
    Body, 
    Get,
    ValidationPipe,
    UsePipes 
} from '@nestjs/common';
import { LoginDto } from '../../common/dtos/auth.dto';
import { API_ROUTES } from '../../common/routes/api.routes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';

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
    async refreshToken(@CurrentUser() user: any) {
        return this.authService.refreshToken(user.id);
    }

    @ApiOperation({ summary: 'Get user profile' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Returns user profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Get(API_ROUTES.AUTH.PROFILE)
    getProfile(@CurrentUser() user: any) {
        return user;
    }

    @Post('init-super-admin')
    async createSuperAdmin() {
        return this.authService.createInitialSuperAdmin();
    }
} 