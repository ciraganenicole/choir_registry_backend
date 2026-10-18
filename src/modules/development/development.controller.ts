import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { DevelopmentAccess, DevelopmentGuard, DevelopmentRequest } from './development.auth';
import {
  DevelopmentAccessDto,
  DevelopmentPeopleQuery,
  SaveDevelopmentProfileDto,
} from './development.dto';
import { DevelopmentService } from './development.service';

@Catch()
export class DevelopmentErrors implements ExceptionFilter {
  private readonly logger = new Logger('Development');
  catch(error: unknown, host: ArgumentsHost) {
    const status =
      error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur est survenue. Veuillez réessayer.';
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const raw =
        typeof response === 'string' ? response : (response as { message?: unknown }).message;
      if (
        typeof raw === 'string' &&
        raw !== 'Validation failed' &&
        !/^(File|Field|Too many|Multipart|Unexpected|Bad Request|Unauthorized|Forbidden|Internal Server|Request Entity)/.test(
          raw,
        )
      )
        message = raw;
      else if (status === 413) message = 'La photo ne doit pas dépasser 5 Mo.';
      else if (status === 400)
        message =
          'Vérifiez les champs saisis et le format de la photo (JPEG, PNG ou WebP, 5 Mo maximum).';
    } else {
      this.logger.error(
        'Échec d’une opération de l’annuaire.',
        error instanceof Error ? error.stack : undefined,
      );
    }
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, message });
  }
}

@Controller('development')
@UseFilters(DevelopmentErrors)
export class DevelopmentController {
  constructor(
    private readonly access: DevelopmentAccess,
    private readonly service: DevelopmentService,
  ) {}

  @Post('access')
  login(@Body() dto: DevelopmentAccessDto, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.access.issue(dto.phone, dto.purpose);
  }

  @Get('catalog')
  @UseGuards(DevelopmentGuard)
  catalog(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.service.catalog();
  }

  @Get('me')
  @UseGuards(DevelopmentGuard)
  me(@Req() request: DevelopmentRequest, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.service.me(request.development.phone);
  }

  @Put('me')
  @UseGuards(DevelopmentGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3, fieldSize: 64 * 1024 },
    }),
  )
  save(
    @Req() request: DevelopmentRequest,
    @Body() dto: SaveDevelopmentProfileDto,
    @UploadedFile() photo: Express.Multer.File,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return this.service.save(request.development.phone, dto, photo);
  }

  @Get('people')
  @UseGuards(DevelopmentGuard)
  people(@Query() query: DevelopmentPeopleQuery, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.service.people(query);
  }
}
