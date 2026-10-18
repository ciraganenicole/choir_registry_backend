import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
export type DevelopmentPurpose = 'personal' | 'directory';
export interface DevelopmentIdentity {
  phone: string;
  purpose: DevelopmentPurpose;
}
export type DevelopmentRequest = Request & { development: DevelopmentIdentity };
export function normalizePhone(raw: string): string {
  let phone = raw
    .trim()
    .replace(/[\s().-]/g, '')
    .replace(/^00/, '+');
  if (/^0[1-9]\d{8}$/.test(phone)) phone = '+243' + phone.slice(1);
  else if (/^[1-9]\d{8}$/.test(phone)) phone = '+243' + phone;
  else if (/^243[1-9]\d{8}$/.test(phone)) phone = '+' + phone;
  if (!/^\+[1-9]\d{7,14}$/.test(phone))
    throw new BadRequestException(
      'Saisissez un numéro valide, par exemple 0853 242 606, 853 242 606 ou +243 853 242 606.',
    );
  return phone;
}
@Injectable()
export class DevelopmentAccess {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}
  private secret(): string {
    const value = this.config.get<string>('DEVELOPMENT_JWT_SECRET');
    if (!value || value.length < 32 || value === this.config.get<string>('JWT_SECRET'))
      throw new ServiceUnavailableException(
        'L’accès est temporairement indisponible. Contactez un responsable.',
      );
    return value;
  }
  assertOrganizer(phone: string): void {
    const allowed = (this.config.get<string>('DEVELOPMENT_DIRECTORY_PHONES') || '')
      .split(',')
      .filter((s) => s.trim())
      .map((s) => {
        try {
          return normalizePhone(s);
        } catch {
          return '';
        }
      });
    if (!allowed.includes(phone))
      throw new ForbiddenException('Ce numéro n’est pas autorisé à consulter l’annuaire.');
  }
  async issue(rawPhone: string, purpose: DevelopmentPurpose) {
    const phone = normalizePhone(rawPhone);
    if (purpose === 'directory') this.assertOrganizer(phone);
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
    if (payload.purpose === 'directory') this.assertOrganizer(payload.phone);
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
    if ((handler === 'me' || handler === 'save') && request.development.purpose !== 'personal')
      throw new ForbiddenException(
        'Identifiez-vous avec votre numéro personnel pour modifier votre fiche.',
      );
    if (handler === 'people' && request.development.purpose !== 'directory')
      throw new ForbiddenException('L’annuaire est réservé aux responsables autorisés.');
    return true;
  }
}
