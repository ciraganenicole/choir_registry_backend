import { 
    Controller, 
    Post, 
    Body, 
    Get,
    ValidationPipe,
    UsePipes,
    UseGuards,
    Logger
} from '@nestjs/common';
import { LoginDto } from '../../common/dtos/auth.dto';
import { RegisterChoirAdminDto } from '../../common/dtos/choir.dto';
import { API_ROUTES } from '../../common/routes/api.routes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller()
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Public()
    @ApiOperation({ summary: 'Register new choir admin' })
    @ApiResponse({ status: 201, description: 'Choir admin registered successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @Post(API_ROUTES.AUTH.REGISTER)
    @UsePipes(new ValidationPipe({ transform: true }))
    async registerChoirAdmin(@Body() registerDto: RegisterChoirAdminDto) {
        this.logger.debug('Received registration request:', registerDto);
        return this.authService.registerChoirAdmin(registerDto);
    }

    @Public()
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Returns access token' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Post(API_ROUTES.AUTH.LOGIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(API_ROUTES.AUTH.REFRESH)
    async refreshToken(@CurrentUser() user: any) {
        return this.authService.refreshToken(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user profile' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Returns user profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Get(API_ROUTES.AUTH.PROFILE)
    getProfile(@CurrentUser() user: any) {
        return user;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @Post('init-super-admin')
    async createSuperAdmin() {
        return this.authService.createInitialSuperAdmin();
    }
} 