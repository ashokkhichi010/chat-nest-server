import { ClientSession, Types } from 'mongoose';

export class loginBodyDto {}

export class LogoutBodyDto {
  refreshToken: string;
}

export class refreshTokensBodyDto extends LogoutBodyDto {}
export class ForgotPasswordBodyDto {
  email: string;
}

export class ResetPasswordBodyDto {
  token: string;
  password: string;
}

export class removeTokenDto {
  user: Types.ObjectId;
  device: Types.ObjectId | undefined | null = null;
  type: string | undefined | null = null;
  session: ClientSession = null;
}
