import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { saveFileLocally } from '../../config/storage.config';
import * as multer from 'multer';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CONTENT_UPLOAD_CODES } from '../users/permission-codes.constant';

const imageTempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, `${uniqueSuffix}-${cleanFileName}`);
  },
});

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: imageTempStorage,
    fileFilter: (req, file, cb) => {
      // Validate file type
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
        return cb(new BadRequestException('Only JPG, JPEG, and PNG files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const imageUrl = await saveFileLocally(file, 'images');

      return { url: imageUrl };
    } catch (error: any) {
      // Clean up the temporary file in case of error
      if (file.path) {
        fs.unlink(file.path, (err) => {
          // Silently handle file deletion errors
        });
      }
      throw new BadRequestException(
        error?.message || 'Failed to upload image'
      );
    }
  }

  @Post('content-image')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(...CONTENT_UPLOAD_CODES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: imageTempStorage,
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.match(/^image\/(jpg|jpeg|png|webp|gif)$/i)
        ) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG, PNG, WEBP, and GIF files are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadContentImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const imageUrl = await saveFileLocally(file, 'content');
      return { url: imageUrl };
    } catch (error: unknown) {
      if (file.path) {
        fs.unlink(file.path, () => undefined);
      }
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      throw new BadRequestException(message);
    }
  }

  @Post('content-video')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(...CONTENT_UPLOAD_CODES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: imageTempStorage,
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.match(/^video\/(mp4|webm|quicktime|ogg)$/i)
        ) {
          return cb(
            new BadRequestException(
              'Only MP4, WEBM, MOV, and OGG video files are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  async uploadContentVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const videoUrl = await saveFileLocally(file, 'content-videos');
      return { url: videoUrl };
    } catch (error: unknown) {
      if (file.path) {
        fs.unlink(file.path, () => undefined);
      }
      const message =
        error instanceof Error ? error.message : 'Failed to upload video';
      throw new BadRequestException(message);
    }
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads/temp';
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Clean the original filename and add timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  }))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const documentUrl = await saveFileLocally(file, 'reports');

      return { url: documentUrl };
    } catch (error: any) {
      // Clean up the temporary file in case of error
      if (file.path) {
        fs.unlink(file.path, (err) => {
          // Silently handle file deletion errors
        });
      }
      throw new BadRequestException(
        error?.message || 'Failed to upload document'
      );
    }
  }
} 