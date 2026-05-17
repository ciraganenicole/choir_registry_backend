import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicContentService } from './public-content.service';
import { PublicContentListQueryDto } from './dto/public-content-query.dto';

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

  @Get('donations')
  async getDonations() {
    return this.publicContent.getDonationSettings();
  }
}
