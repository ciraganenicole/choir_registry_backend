import { Controller, Post, Body } from '@nestjs/common';
import { WebAuthnService } from './webauthn.service';

@Controller('webauthn')
export class WebAuthnController {
  constructor(private readonly webAuthnService: WebAuthnService) {}

  @Post('register-challenge')
  async registerChallenge(@Body() body: { userId: number }) {
    return this.webAuthnService.generateRegistrationChallenge(body.userId);
  }

  @Post('verify-registration')
  async verifyRegistration(@Body() body: { userId: number; credential: any }) {
    return this.webAuthnService.verifyRegistration(body.userId, body.credential);
  }
}
