import { Repository } from 'typeorm';
import { DevelopmentDirectoryAccess } from './development.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DevelopmentAccess, DevelopmentGuard, normalizePhone } from './development.auth';
import { ExecutionContext } from '@nestjs/common';
import { normalizeSpecialty } from './development.catalog';
import { photoExtension } from './development.service';

describe('Accès au département de développement', () => {
  const secret = 'development-test-secret-at-least-32-characters';
  const values: Record<string, string> = {
    DEVELOPMENT_JWT_SECRET: secret,
    JWT_SECRET: 'choir-test-secret',
    DEVELOPMENT_DIRECTORY_PHONES: '+243810000000',
  };
  const jwt = new JwtService();
  const config = { get: (key: string) => values[key] } as ConfigService;
  const allowed = new Map<string, boolean>();
  const directoryAccess = {
    existsBy: jest.fn(
      async ({ phone, isActive }: { phone: string; isActive: boolean }) =>
        allowed.get(phone) === isActive,
    ),
  } as unknown as Repository<DevelopmentDirectoryAccess>;
  const access = new DevelopmentAccess(config, jwt, directoryAccess);
  beforeEach(() => {
    allowed.clear();
    allowed.set('+243810000000', true);
  });

  it.each([
    ['853242606', '+243853242606'],
    ['0853242606', '+243853242606'],
    [' 0853 242-606 ', '+243853242606'],
    ['243853242606', '+243853242606'],
    ['+243 853 242 606', '+243853242606'],
    ['00243 (853) 242-606', '+243853242606'],
    ['+1 (438) 998-6297', '+14389986297'],
    ['001 (438) 998-6297', '+14389986297'],
  ])('normalise %s en %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
    expect(normalizePhone(expected)).toBe(expected);
  });
  it.each(['', '081000', '08532426060', '000000000', '+243abc853242606', '853/242606'])(
    'refuse le numéro invalide %s',
    (raw) => {
      expect(() => normalizePhone(raw)).toThrow();
    },
  );
  it('autorise les formats locaux avec la même identité et les mêmes droits', async () => {
    const local = await access.issue('0810000000', 'directory');
    const withoutZero = await access.issue('810000000', 'directory');
    expect(local.phone).toBe('+243810000000');
    expect(withoutZero.phone).toBe(local.phone);
    await expect(access.verify(local.token)).resolves.toEqual({
      phone: '+243810000000',
      purpose: 'directory',
    });
    await expect(access.issue('0810000002', 'directory')).rejects.toThrow();
  });
  it('normalise les espaces et le préfixe international', () => {
    expect(normalizePhone(' 00243 (810) 000-000 ')).toBe('+243810000000');
    expect(normalizePhone('0810000000')).toBe('+243810000000');
    expect(() => normalizePhone('+243abc810000000')).toThrow();
  });
  it('normalise les spécialités sans perdre les distinctions de mots', () => {
    expect(normalizeSpecialty('  MÉDECIN   Généraliste  ')).toBe('medecin generaliste');
  });
  it('émet un jeton personnel de deux heures', async () => {
    const session = await access.issue('+243810000001', 'personal');
    const decoded = jwt.decode(session.token);
    expect(decoded.exp - decoded.iat).toBe(7200);
    await expect(access.verify(session.token)).resolves.toEqual({
      phone: '+243810000001',
      purpose: 'personal',
    });
  });
  it('refuse les numéros non autorisés et les listes vides', async () => {
    await expect(access.issue('+243810000002', 'directory')).rejects.toThrow();
    const empty = new DevelopmentAccess(config, jwt, {
      existsBy: async () => false,
    } as unknown as Repository<DevelopmentDirectoryAccess>);
    await expect(empty.issue('+243810000000', 'directory')).rejects.toThrow();
  });
  it('revérifie la liste des responsables après émission du jeton', async () => {
    const session = await access.issue('+243810000000', 'directory');
    allowed.delete('+243810000000');
    await expect(access.verify(session.token)).rejects.toThrow();
    allowed.set('+243810000000', true);
  });
  it('utilise uniquement la base et respecte les accès désactivés', async () => {
    allowed.set('+243810000000', false);
    await expect(access.issue('0810000000', 'directory')).rejects.toThrow();
    allowed.set('+243810000003', true);
    const session = await access.issue('0810000003', 'directory');
    expect(session.phone).toBe('+243810000003');
    allowed.set('+243810000003', false);
    await expect(access.verify(session.token)).rejects.toThrow();
  });
  it('refuse les jetons expirés et ceux du registre existant', async () => {
    const token = jwt.sign(
      { phone: '+243810000000', purpose: 'personal' },
      { secret, issuer: 'development', audience: 'development', expiresIn: -1 },
    );
    await expect(access.verify(token)).rejects.toThrow();
    await expect(
      access.verify(jwt.sign({ sub: 1, type: 'admin' }, { secret: 'choir-test-secret' })),
    ).rejects.toThrow();
    await expect(
      access.verify(jwt.sign({ phone: '+243810000000', purpose: 'personal' }, { secret })),
    ).rejects.toThrow();
  });
  it('ne configure pas de secret implicite ou partagé avec le registre', async () => {
    const missing = new DevelopmentAccess(
      { get: () => undefined } as unknown as ConfigService,
      jwt,
      directoryAccess,
    );
    await expect(missing.issue('+243810000000', 'personal')).rejects.toThrow();
    const shared = new DevelopmentAccess(
      { get: () => secret } as unknown as ConfigService,
      jwt,
      directoryAccess,
    );
    await expect(shared.issue('+243810000000', 'personal')).rejects.toThrow();
  });
  it('partage la session entre fiche et annuaire en vérifiant les autorisations en base', async () => {
    const guard = new DevelopmentGuard(access);
    const context = (token: string, name: string) =>
      ({
        getHandler: () => ({ name }),
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer ' + token } }),
        }),
      }) as unknown as ExecutionContext;
    const personal = await access.issue('+243810000001', 'personal');
    const directory = await access.issue('+243810000000', 'directory');
    await expect(guard.canActivate(context(personal.token, 'people'))).rejects.toThrow();
    await expect(guard.canActivate(context(directory.token, 'save'))).resolves.toBe(true);
    const shared = await access.issue('0810000000');
    await expect(guard.canActivate(context(shared.token, 'people'))).resolves.toBe(true);
    await expect(guard.canActivate(context(shared.token, 'save'))).resolves.toBe(true);
    allowed.set('+243810000000', false);
    await expect(guard.canActivate(context(shared.token, 'people'))).rejects.toThrow();
    await expect(guard.canActivate(context(shared.token, 'save'))).resolves.toBe(true);
    await expect(guard.canActivate(context(personal.token, 'me'))).resolves.toBe(true);
  });
  it('contrôle le type, la signature et la taille des photos', () => {
    const file = (mimetype: string, buffer: Buffer, size = buffer.length) =>
      ({ mimetype, buffer, size }) as Express.Multer.File;
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(photoExtension(file('image/png', png))).toBe('png');
    expect(photoExtension(file('image/jpeg', Buffer.from([255, 216, 255])))).toBe('jpg');
    expect(photoExtension(file('image/webp', Buffer.from('RIFF0000WEBP')))).toBe('webp');
    expect(() => photoExtension(file('image/png', Buffer.from('fake')))).toThrow();
    expect(() => photoExtension(file('image/gif', png))).toThrow();
    expect(() => photoExtension(file('image/png', png, 6 * 1024 * 1024))).toThrow();
  });
});
