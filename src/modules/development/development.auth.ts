import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevelopmentDirectoryAccess } from './development.entity';
import { normalizePhone } from './development-phone.util';
export { normalizePhone } from './development-phone.util';
export type DevelopmentPurpose = 'personal' | 'directory';
export interface DevelopmentIdentity {
  phone: string;
  purpose: DevelopmentPurpose;
}
export type DevelopmentRequest = Request & { development: DevelopmentIdentity };
@Injectable()
export class DevelopmentAccess {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(DevelopmentDirectoryAccess)
    private readonly directoryAccess: Repository<DevelopmentDirectoryAccess>,
  ) {}
  private secret(): string {
    const value = this.config.get<string>('DEVELOPMENT_JWT_SECRET');
    if (!value || value.length < 32 || value === this.config.get<string>('JWT_SECRET'))
      throw new ServiceUnavailableException(
        'L’accès est temporairement indisponible. Contactez un responsable.',
      );
    return value;
  }
  async assertOrganizer(phone: string): Promise<void> {
    const allowed = await this.directoryAccess.existsBy({
      phone: normalizePhone(phone),
      isActive: true,
    });
    if (!allowed)
      throw new ForbiddenException('Ce numéro n’est pas autorisé à consulter l’annuaire.');
  }
  async issue(rawPhone: string, purpose: DevelopmentPurpose = 'personal') {
    const phone = normalizePhone(rawPhone);
    if (purpose === 'directory') await this.assertOrganizer(phone);
    const token = await this.jwt.signAsync(
      { phone, purpose },
      {
        secret: this.secret(),
        algorithm: 'HS256',
        issuer: 'development',
        audience: 'development',
        expiresIn: '2h',
      },
    );
    return {
      token,
      phone,
      purpose,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };
  }
  async verify(token: string): Promise<DevelopmentIdentity> {
    const secret = this.secret();
    let payload: DevelopmentIdentity;
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret,
        algorithms: ['HS256'],
        issuer: 'development',
        audience: 'development',
      });
      if (
        !['personal', 'directory'].includes(payload.purpose) ||
        normalizePhone(payload.phone) !== payload.phone
      )
        throw new Error();
    } catch {
      throw new UnauthorizedException(
        'Votre session a expiré. Veuillez saisir à nouveau votre numéro.',
      );
    }
    if (payload.purpose === 'directory') await this.assertOrganizer(payload.phone);
    return { phone: payload.phone, purpose: payload.purpose };
  }
}
@Injectable()
export class DevelopmentGuard implements CanActivate {
  constructor(private readonly access: DevelopmentAccess) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DevelopmentRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Veuillez saisir votre numéro pour continuer.');
    request.development = await this.access.verify(header.slice(7));
    const handler = context.getHandler().name;
    if (handler === 'people') await this.access.assertOrganizer(request.development.phone);
    return true;
  }
}
