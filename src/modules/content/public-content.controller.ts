import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PublicContentService } from './public-content.service';
import { PushService } from './push.service';
import {
  PublicContentListQueryDto,
  PublicNotificationsQueryDto,
  PublicProgrammeQueryDto,
} from './dto/public-content-query.dto';
import { CreateParticipationDto } from './dto/participation.dto';
import {
  ProgramReminderDto,
  PushSubscriptionDto,
} from './dto/push.dto';

@Controller('public/content')
export class PublicContentController {
  constructor(
    private readonly publicContent: PublicContentService,
    private readonly push: PushService,
  ) {}

  @Get('events')
  async listEvents(@Query() query: PublicContentListQueryDto) {
    return this.publicContent.listPublishedEvents(query);
  }

  @Get('events/:slug')
  async getEvent(@Param('slug') slug: string) {
    return this.publicContent.getPublishedEventBySlug(slug);
  }

  @Get('departments')
  async listDepartments(@Query() query: PublicContentListQueryDto) {
    return this.publicContent.listPublishedDepartments(query);
  }

  @Get('departments/:slug')
  async getDepartment(@Param('slug') slug: string) {
    return this.publicContent.getPublishedDepartmentBySlug(slug);
  }

  @Get('site')
  async getSite() {
    return this.publicContent.getSiteProfile();
  }

  @Get('schedule/today')
  async getTodaySchedule(@Query('date') date?: string) {
    return this.publicContent.getTodaySchedule(date);
  }

  @Get('donations')
  async getDonations() {
    return this.publicContent.getDonationSettings();
  }

  @Get('teachings')
  async listTeachings(@Query() query: PublicContentListQueryDto) {
    return this.publicContent.listPublishedTeachings(query);
  }

  @Get('teachings/:slug')
  async getTeaching(@Param('slug') slug: string) {
    return this.publicContent.getPublishedTeachingBySlug(slug);
  }

  @Get('community')
  async listCommunity(@Query() query: PublicContentListQueryDto) {
    return this.publicContent.listPublishedCommunityUpdates(query);
  }

  @Get('live-events')
  async listLiveEvents(@Query() query: PublicContentListQueryDto) {
    return this.publicContent.listPublishedLiveEvents(query);
  }

  @Get('notifications')
  async listNotifications(@Query() query: PublicNotificationsQueryDto) {
    return this.publicContent.getPublicNotifications(query);
  }

  @Get('programmes')
  async listProgrammes(@Query() query: PublicProgrammeQueryDto) {
    return this.publicContent.getPublicProgrammes(query);
  }

  @Post('participations')
  @HttpCode(201)
  async createParticipation(@Body() dto: CreateParticipationDto) {
    return this.publicContent.createParticipation(dto);
  }

  @Get('push/public-key')
  getPushPublicKey() {
    return {
      enabled: this.push.isEnabled(),
      publicKey: this.push.getPublicKey(),
    };
  }

  @Post('push/subscriptions')
  @HttpCode(201)
  savePushSubscription(
    @Body() dto: PushSubscriptionDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.push.saveSubscription(dto, userAgent);
  }

  @Post('program-reminders')
  @HttpCode(201)
  createProgramReminder(@Body() dto: ProgramReminderDto) {
    return this.push.createReminder(dto);
  }

  @Delete('program-reminders')
  deleteProgramReminder(
    @Query('clientId') clientId?: string,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.push.deleteReminder({ clientId, deviceId });
  }
}
