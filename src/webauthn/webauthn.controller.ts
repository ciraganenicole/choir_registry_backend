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

  @Post('authenticate-challenge')
  async getAuthenticationChallenge(@Body() body: { userId: number }) {
    return this.webAuthnService.generateAuthenticationChallenge(body.userId);
  }

  @Post('verify-authentication')
  async verifyAuthentication(@Body() body: { userId: number; credential: any }) {
    return this.webAuthnService.verifyAuthentication(body.userId, body.credential);
  }
}
