/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Param, Put, Get, ParseIntPipe, ValidationPipe, UsePipes, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventType } from './event-type.enum';
import { UserCategory } from '../users/enums/user-category.enum';

@ApiTags('Events')
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    async createEvent(@Body() eventData: Partial<Event>): Promise<Event> {
        return this.eventsService.createEvent(eventData);
    }

    @Put(':id/start')
    @ApiOperation({ summary: 'Start an event' })
    @ApiResponse({ status: 200, description: 'Event started successfully' })
    async startEvent(@Param('id', ParseIntPipe) id: number): Promise<Event> {
        return this.eventsService.startEvent(id);
    }

    @Put(':id/end')
    @ApiOperation({ summary: 'End an event' })
    @ApiResponse({ status: 200, description: 'Event ended successfully' })
    async endEvent(@Param('id', ParseIntPipe) id: number): Promise<Event> {
        return this.eventsService.endEvent(id);
    }

    @Get('active')
    @ApiOperation({ summary: 'Get active events' })
    @ApiResponse({ status: 200, description: 'List of active events' })
    async getActiveEvents(): Promise<Event[]> {
        return this.eventsService.getActiveEvents();
    }

    @Get('type/:eventType')
    @ApiOperation({ summary: 'Get events by type' })
    @ApiResponse({ status: 200, description: 'List of events by type' })
    async getEventsByType(@Param('eventType') eventType: EventType): Promise<Event[]> {
        return this.eventsService.getEventsByType(eventType);
    }

    @Get('category/:category')
    @ApiOperation({ summary: 'Get events by category' })
    @ApiResponse({ status: 200, description: 'List of events by category' })
    async getEventsByCategory(@Param('category') category: UserCategory): Promise<Event[]> {
        const allowedCategories = [UserCategory.WORSHIPPER, UserCategory.COMMITTEE];

        if (!allowedCategories.includes(category)) {
            throw new ForbiddenException('Access denied: You are not authorized to view these events.');
        }

        return this.eventsService.getEventsByCategory(category);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get event by ID' })
    @ApiResponse({ status: 200, description: 'Event details' })
    async getEventById(@Param('id', ParseIntPipe) id: number): Promise<Event> {
        const event = await this.eventsService.getEventById(id);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }

    @Get('today')
    @ApiOperation({ summary: 'Get today\'s scheduled events' })
    @ApiResponse({ status: 200, description: 'List of today\'s events' })
    getTodayEvents(): EventType[] {
        return this.eventsService.getTodayEvents();
    }

    @Get('next')
    @ApiOperation({ summary: 'Get the next scheduled events' })
    @ApiResponse({ status: 200, description: 'List of upcoming events with dates' })
    getNextEvents(): { event: EventType; date: Date }[] {
        return this.eventsService.getNextEvents();
    }
}
