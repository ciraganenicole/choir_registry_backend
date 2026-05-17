import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentLinkedStubService } from './content-linked-stub.service';
import { CreateLinkedStubDto } from './dto/create-linked-stub.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSION_CODES } from '../users/permission-codes.constant';
import { CreateContentTypeDto, UpdateContentTypeDto } from './dto/content-type.dto';
import {
  CreateContentFieldDto,
  UpdateContentFieldDto,
} from './dto/content-field.dto';
import {
  CreateContentDto,
  ListContentQueryDto,
  UpdateContentDto,
} from './dto/content-instance.dto';
import { ContentJwtUser } from './content.types';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly linkedStubService: ContentLinkedStubService,
  ) {}

  @Get('types')
  @UseGuards(JwtAuthGuard)
  findAllTypes(@CurrentUser() user: ContentJwtUser) {
    return this.contentService.findAllTypes(user);
  }

  @Get('types/:id')
  @UseGuards(JwtAuthGuard)
  findType(@CurrentUser() user: ContentJwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.contentService.findTypeWithFields(user, id);
  }

  @Post('types')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(
    PERMISSION_CODES.CONTENT_SCHEMA_MANAGE,
    PERMISSION_CODES.GLOBAL_PUBLISHER,
  )
  createType(
    @CurrentUser() user: ContentJwtUser,
    @Body() dto: CreateContentTypeDto,
  ) {
    return this.contentService.createType(user, dto);
  }

  @Patch('types/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(
    PERMISSION_CODES.CONTENT_SCHEMA_MANAGE,
    PERMISSION_CODES.GLOBAL_PUBLISHER,
  )
  updateType(
    @CurrentUser() user: ContentJwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentTypeDto,
  ) {
    return this.contentService.updateType(user, id, dto);
  }

  @Post('types/:typeId/fields')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(
    PERMISSION_CODES.CONTENT_SCHEMA_MANAGE,
    PERMISSION_CODES.GLOBAL_PUBLISHER,
  )
  addField(
    @CurrentUser() user: ContentJwtUser,
    @Param('typeId', ParseIntPipe) typeId: number,
    @Body() dto: CreateContentFieldDto,
  ) {
    return this.contentService.addField(user, typeId, dto);
  }

  @Patch('fields/:fieldId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(
    PERMISSION_CODES.CONTENT_SCHEMA_MANAGE,
    PERMISSION_CODES.GLOBAL_PUBLISHER,
  )
  updateField(
    @CurrentUser() user: ContentJwtUser,
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Body() dto: UpdateContentFieldDto,
  ) {
    return this.contentService.updateField(user, fieldId, dto);
  }

  @Delete('fields/:fieldId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(
    PERMISSION_CODES.CONTENT_SCHEMA_MANAGE,
    PERMISSION_CODES.GLOBAL_PUBLISHER,
  )
  removeField(
    @CurrentUser() user: ContentJwtUser,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    return this.contentService.removeField(user, fieldId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllContents(
    @CurrentUser() user: ContentJwtUser,
    @Query() query: ListContentQueryDto,
  ) {
    return this.contentService.findAllContents(user, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createContent(
    @CurrentUser() user: ContentJwtUser,
    @Body() dto: CreateContentDto,
  ) {
    return this.contentService.createContent(user, dto);
  }

  @Get('linked-options/albums')
  @UseGuards(JwtAuthGuard)
  listAlbumStubs() {
    return this.linkedStubService.listAlbums();
  }

  @Post('linked-options/albums')
  @UseGuards(JwtAuthGuard)
  createAlbumStub(@Body() dto: CreateLinkedStubDto) {
    return this.linkedStubService.createAlbum(dto.label);
  }

  @Get('linked-options/playlists')
  @UseGuards(JwtAuthGuard)
  listPlaylistStubs() {
    return this.linkedStubService.listPlaylists();
  }

  @Post('linked-options/playlists')
  @UseGuards(JwtAuthGuard)
  createPlaylistStub(@Body() dto: CreateLinkedStubDto) {
    return this.linkedStubService.createPlaylist(dto.label);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOneContent(
    @CurrentUser() user: ContentJwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contentService.findOneContent(user, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateContent(
    @CurrentUser() user: ContentJwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.updateContent(user, id, dto);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(
    @CurrentUser() user: ContentJwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contentService.approve(user, id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_CODES.GLOBAL_PUBLISHER)
  publish(
    @CurrentUser() user: ContentJwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contentService.publish(user, id);
  }
}
