import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadToCloudinary } from '../../config/cloudinary.config';
import * as multer from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads';
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
      const imageUrl = await uploadToCloudinary(file);
      
      // Clean up the temporary file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });

      return { url: imageUrl };
    } catch (error: any) {
      // Clean up the temporary file in case of error
      if (file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });
      }
      
      console.error('Upload error:', error);
      throw new BadRequestException(
        error?.message || 'Failed to upload image'
      );
    }
  }
} 