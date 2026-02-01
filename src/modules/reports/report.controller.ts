import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Report } from './report.entity';
import { saveFileLocally } from '../../config/storage.config';
import * as multer from 'multer';
import * as fs from 'fs';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD, UserCategory.COMMITTEE)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads/temp';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  }))
  async create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ): Promise<Report> {
    // If a file is uploaded, save it locally and use the URL
    if (file) {
      try {
        const documentUrl = await saveFileLocally(file, 'reports');
        createReportDto.attachmentUrl = documentUrl;
      } catch (error: any) {
        // Clean up the temporary file in case of error
        if (file.path) {
          fs.unlink(file.path, (err) => {
            // Silently handle file deletion errors
          });
        }
        throw error;
      }
    }
    
    return await this.reportService.create(createReportDto, user.id);
  }

  @Get()
  async findAll(): Promise<Report[]> {
    return await this.reportService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Report> {
    return await this.reportService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads/temp';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ): Promise<Report> {
    // If a file is uploaded, save it locally and use the URL
    if (file) {
      try {
        const documentUrl = await saveFileLocally(file, 'reports');
        updateReportDto.attachmentUrl = documentUrl;
      } catch (error: any) {
        // Clean up the temporary file in case of error
        if (file.path) {
          fs.unlink(file.path, (err) => {
            // Silently handle file deletion errors
          });
        }
        throw error;
      }
    }
    
    return await this.reportService.update(id, updateReportDto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.reportService.remove(id, user.id);
    return { message: 'Report deleted successfully' };
  }

  @Get('permissions')
  async getMyPermissions(@CurrentUser() user: any): Promise<any> {
    return this.reportService.getUserPermissions(user.id);
  }
}
