import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { ClientSession, Types } from 'mongoose';
import { ContactNumberDto } from 'src/users/users.dto';

export class RegisterBodyDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  contactNumber: ContactNumberDto;
}

export class LoginBodyDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}

export class LogoutBodyDto {
  @ApiProperty()
  refreshToken: string;
}

export class RefreshTokensBodyDto extends LogoutBodyDto {}
export class ForgotPasswordBodyDto {
  @ApiProperty()
  email: string;
}

export class ResetPasswordBodyDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  password: string;
}

export class RemoveTokenDto {
  user: Types.ObjectId;
  device: Types.ObjectId | undefined | null = null;
  type: string | undefined | null = null;
  session: ClientSession = null;
}

export class CheckEmailContactNumberDto {
  @ApiProperty({ enum: ['email', 'contactNumber'], example: 'email' })
  @IsIn(['email', 'contactNumber'])
  @IsString()
  type: string;

  @ApiPropertyOptional({ type: String, required: true })
  @ValidateIf((o) => o.type === 'email')
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ type: ContactNumberDto, required: true })
  @ValidateIf((o) => o.type === 'contactNumber')
  @ValidateNested()
  @Type(() => ContactNumberDto)
  contactNumber: ContactNumberDto;
}
