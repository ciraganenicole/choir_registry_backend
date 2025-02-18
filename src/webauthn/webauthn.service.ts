import { Injectable } from '@nestjs/common';
import { generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from '../attendance/attendance.service';  // Import AttendanceService

@Injectable()
export class WebAuthnService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly attendanceService: AttendanceService,  // Inject AttendanceService
  ) {}

  async generateRegistrationChallenge(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const options = await generateRegistrationOptions({
      rpName: 'Choir Registry',
      rpID: 'localhost',
      userID: new TextEncoder().encode(user.id.toString()),
      userName: user.name,
      attestationType: 'none',
    });

    // Store challenge in the User entity
    user.challenge = options.challenge;
    await this.userRepository.save(user);

    return options;
  }

  async verifyRegistration(userId: number, credential: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.challenge) {
      throw new Error('Challenge not found');
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.challenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
    });

    if (verification.verified) {
      // Store public key and clear challenge after successful verification
      user.publicKey = JSON.stringify(verification.registrationInfo);
      user.challenge = null;
      await this.userRepository.save(user);

      return { success: true };
    }

    return { success: false };
  }

  async verifyAttendance(userId: number, credential: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has a public key (authentication requires it)
    if (!user.publicKey) {
      throw new Error('User public key not found');
    }

    // If there's no active challenge, generate a new one
    if (!user.challenge) {
      const options = await this.generateRegistrationChallenge(userId); // This is an optional step if you want to generate a new challenge for authentication
      user.challenge = options.challenge;
      await this.userRepository.save(user);
    }

    if (!credential || !userId) {
      throw new Error("User or credential missing");
    }

    const authenticationResponse = {
      response: credential,
      expectedChallenge: user.challenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
      credential: {
        id: user.id.toString(),
        publicKey: new Uint8Array(Buffer.from(user.publicKey, 'base64')),
        counter: user.counter || 0,
      },
    };

    // Perform WebAuthn verification
    const verification = await verifyAuthenticationResponse(authenticationResponse);

    if (verification.verified) {
      const { newCounter } = verification.authenticationInfo;

      // Update the counter and clear the challenge after verification
      user.counter = newCounter;
      user.challenge = null;
      await this.userRepository.save(user);

      // Pass both userId and credential to markAttendance
      await this.attendanceService.markAttendance(user.id, credential);  // Pass both arguments

      return { success: true };
    }

    return { success: false };
  }
}
