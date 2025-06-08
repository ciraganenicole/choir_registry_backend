import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../modules/users/enums/role.enum';

export class UpdateChoirMemberRoleDto {
    @ApiProperty({ enum: UserRole, description: 'New role for the choir member' })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiProperty({ description: 'ID of the choir member' })
    @IsUUID()
    memberId: string;
} 