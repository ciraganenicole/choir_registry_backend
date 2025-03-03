/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { EventType } from './event-type.enum';
import { UserCategory } from '../users/enums/user-category.enum';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>
    ) {}

    // Event schedule mapping
    private readonly eventSchedule: Record<EventType, { days: number[], time: string } | null> = {
        [EventType.NORMAL]: { days: [3, 0], time: '13:30' }, // Wednesday (3) and Sunday (0)
        [EventType.WORSHIPPER]: { days: [4], time: '14:00' },    // Thursday (4)
        [EventType.SUNDAY_SERVICE]: { days: [0], time: '09:00' }, // Sunday (0)
        [EventType.COMMITTEE]: null, // Random
        [EventType.MUSIC]: null,          // Random
        [EventType.SPECIAL]: null         // Random
    };

    async createEvent(eventData: Partial<Event>): Promise<Event> {
        const event = this.eventRepository.create(eventData);
        return this.eventRepository.save(event);
    }

    async startEvent(eventId: number): Promise<Event> {
        const event = await this.getEventById(eventId);
        // Logic for starting the event
        return event;
    }

    async endEvent(eventId: number): Promise<Event> {
        const event = await this.getEventById(eventId);
        // Logic for ending the event
        return event;
    }

    async getEventsByCategory(category: UserCategory): Promise<Event[]> {
        const allowedCategories = [UserCategory.WORSHIPPER, UserCategory.COMMITTEE];

        if (!allowedCategories.includes(category)) {
            throw new ForbiddenException('Access denied: You are not authorized to view these events.');
        }

        return this.eventRepository.find({ where: { category } });
    }

    async getActiveEvents(): Promise<Event[]> {
        return this.eventRepository.find();
    }

    async getEventById(eventId: number): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new NotFoundException('Event not found');
        }
        return event;
    }

    async getEventsByType(type: EventType): Promise<Event[]> {
        return this.eventRepository.find({ where: { type } });
    }

    async getEventByType(type: EventType): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { type } });
        if (!event) {
            throw new NotFoundException(`Event of type ${type} not found`);
        }
        return event;
    }

    // Get today's scheduled events
    getTodayEvents(): EventType[] {
        const today = new Date().getDay();
        return Object.entries(this.eventSchedule)
            .filter(([_, schedule]) => schedule?.days.includes(today))
            .map(([eventType]) => eventType as EventType);
    }

    // Get the next scheduled event for each recurring event
    getNextEvents(): { event: EventType; date: Date }[] {
        const now = new Date();

        return Object.entries(this.eventSchedule)
            .filter(([_, schedule]) => schedule !== null)
            .map(([eventType, schedule]) => {
                const nextDate = new Date();
                const nextDay = schedule!.days.find(day => day >= now.getDay()) ?? schedule!.days[0];

                if (nextDay < now.getDay() || (nextDay === now.getDay() && schedule!.time <= now.toTimeString().slice(0, 5))) {
                    nextDate.setDate(now.getDate() + 7 - (now.getDay() - nextDay));
                } else {
                    nextDate.setDate(now.getDate() + (nextDay - now.getDay()));
                }

                const [hours, minutes] = schedule!.time.split(':').map(Number);
                nextDate.setHours(hours, minutes, 0, 0);

                return { event: eventType as EventType, date: nextDate };
            });
    }
}
