import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicContentService } from './public-content.service';
import {
  PublicContentListQueryDto,
  PublicNotificationsQueryDto,
  PublicProgrammeQueryDto,
} from './dto/public-content-query.dto';

@Controller('public/content')
export class PublicContentController {
  constructor(private readonly publicContent: PublicContentService) {}

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
}
