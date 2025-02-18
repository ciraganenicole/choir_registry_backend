import { Controller, Post, Body, Param } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Controller('admin')
export class AdminController {
  constructor(private userService: UsersService) {}

  @Post('register-fingerprint/:userId')
  async registerFingerprint(@Param('userId') userId: number, @Body() fingerprintData: { publicKey: string }) {
    return await this.userService.registerFingerprint(userId, fingerprintData.publicKey);
  }
}
