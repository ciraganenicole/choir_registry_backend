import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Choir Management API')
    .setDescription('API documentation for the Choir Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Attendance', 'Attendance management endpoints')
    .addTag('Leave', 'Leave management endpoints')
    .addTag('Events', 'Event management endpoints')
    .build(); 