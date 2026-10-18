import { BadRequestException } from '@nestjs/common';

/** Les numéros locaux sont interprétés comme des numéros de RDC. */
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
