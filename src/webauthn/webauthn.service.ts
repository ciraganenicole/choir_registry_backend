import { Injectable } from '@nestjs/common';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class WebAuthnService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly attendanceService: AttendanceService, 
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
      response: credential.response,
      expectedChallenge: user.challenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
    });
  
    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const credentialPublicKey = credential.publicKey;
      const credentialID = credential.id;
    
      if (!credentialPublicKey || !credentialID) {
        throw new Error('Missing credential data');
      }
    
      user.publicKey = Buffer.from(credentialPublicKey).toString('base64url');
      console.log("Public Key:", user.publicKey);


      user.credentialID = Buffer.from(credentialID).toString('base64url');
    
      user.challenge = null;
    
      await this.userRepository.save(user);
    
      return { success: true };
    }
  
    return { success: false };
  }

  async generateAuthenticationChallenge(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    if (!user.publicKey || !user.credentialID) {
      throw new Error('User public key or credential ID not found');
    }
  
    const challenge = crypto.getRandomValues(new Uint8Array(32));
  
    const options = await generateAuthenticationOptions({
      rpID: 'localhost',
      allowCredentials: [
        {
          id: Buffer.from(user.credentialID, 'base64url').toString('base64url'),
          transports: ['internal'],
        },
      ],
      userVerification: 'preferred',
      timeout: 60000,
      challenge: Buffer.from(challenge).toString('base64url'),
    });

    user.challenge = options.challenge;
    await this.userRepository.save(user);
  
    return options;
  }

  async verifyAuthentication(userId: number, credential: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.publicKey) {
      throw new Error('User public key not found');
    }

    if (!user.challenge) {
      const options = await this.generateAuthenticationChallenge(userId);
      user.challenge = options.challenge;
      await this.userRepository.save(user);
    }

    if (!credential || !userId) {
      throw new Error("User or credential missing");
    }

    // Decode clientDataJSON before parsing
    const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64url').toString('utf-8');
    const clientData = JSON.parse(clientDataJSON);  // Now parse the decoded JSON string

    const authenticationResponse = {
      id: credential.id,
      rawId: Buffer.from(credential.rawId, 'base64url').toString('base64url'),
      response: {
        authenticatorData: Buffer.from(credential.response.authenticatorData, 'base64url').toString('base64url'),
        clientDataJSON: Buffer.from(clientDataJSON).toString('base64url'),  // Keep it base64url encoded
        signature: Buffer.from(credential.response.signature, 'base64url').toString('base64url'),
        userHandle: credential.response.userHandle
          ? Buffer.from(credential.response.userHandle, 'base64url').toString('utf8')
          : null,
      },
      type: credential.type,
      clientExtensionResults: credential.clientExtensionResults,
      expectedChallenge: user.challenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
      credential: {
        id: Buffer.from(user.credentialID, 'base64url').toString('utf8'),
        publicKey: new Uint8Array(Buffer.from(user.publicKey, 'base64url')),
        counter: user.counter || 0,
      },
    };

    console.log("User Public Key:", user.publicKey);
console.log("User Credential ID:", user.credentialID);
console.log("Authentication Response:", authenticationResponse); 
console.log(Buffer.from(user.credentialID, 'base64url').toString('hex'), 'UUUUUUUUU'); 

    const verification = await verifyAuthenticationResponse({
      response: {
        id: authenticationResponse.id,
        rawId: authenticationResponse.rawId,
        response: {
          authenticatorData: authenticationResponse.response.authenticatorData,
          clientDataJSON: authenticationResponse.response.clientDataJSON,
          signature: authenticationResponse.response.signature,
          userHandle: authenticationResponse.response.userHandle,
        },
        type: authenticationResponse.type,
        clientExtensionResults: authenticationResponse.clientExtensionResults,
      },
      expectedChallenge: authenticationResponse.expectedChallenge,
      expectedOrigin: authenticationResponse.expectedOrigin,
      expectedRPID: authenticationResponse.expectedRPID,
      credential: authenticationResponse.credential,
    });

    if (verification.verified) {
      const { newCounter } = verification.authenticationInfo;
    
      user.counter = newCounter;
      user.challenge = null;
      await this.userRepository.save(user);
    
      // await this.attendanceService.markAttendance(user.id);
    
      return { success: true };
    }

    return { success: false };
  }

  async verifyAttendance(userId: number, credential: any) {
    return this.verifyAuthentication(userId, credential);
  }
}
