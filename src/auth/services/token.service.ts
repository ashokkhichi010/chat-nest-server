import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, ClientSession, Types } from 'mongoose';
import { Token } from '../entities/token.entity';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { removeTokenDto } from '../dto/create-auth.dto';
import { CreateTokenDto, GenerateTokenDto } from '../dto/token.dto';
import { customConfig } from '../../config/config';

const config = customConfig()

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
  ) { }

  async generateToken({ device, expires, sub, type }: GenerateTokenDto): Promise<string> {
    try {
      const payload = { sub, device, iat: moment().unix(), exp: expires.unix(), type };

      return await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET  /* secret: config('JWT_SECRET')*/ });
    } catch (error) {
      throw error;
    }
  }

  async saveToken({ user, device, token, type, expires, blacklisted, session }: CreateTokenDto): Promise<any> {
    try {
      const options = session || null;
      return await this.tokenModel.create([{ user, device, token, type, expires: expires.toISOString(), blacklisted }], { options })[0];
    } catch (error) {
      throw error;
    }
  }

  async verifyToken(token: string, type: string): Promise<Token | undefined> {
    const { sub, device } = await this.jwt.verifyAsync(token);
    const tokenDoc = await this.tokenModel.findOne({ user: new Types.ObjectId(sub), device: new Types.ObjectId(device), type, token });

    if (!tokenDoc) {
      throw new BadRequestException('messages.token.notFound');
    }

    return tokenDoc;
  }

  async getAccessToken(userId: Types.ObjectId, deviceId: Types.ObjectId = null): Promise<any> {
    const tokenType = config.TOKEN_TYPES.ACCESS;

    const expires = moment().add(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 'minutes');
    const token = await this.generateToken({ device: deviceId, expires, sub: userId, type: tokenType });

    return { token, expires: expires.toISOString() };
  }

  async getAndSaveRefreshToken(userId: Types.ObjectId, deviceId: Types.ObjectId = null, session: ClientSession = null): Promise<any> {
    const tokenType = config.TOKEN_TYPES.REFRESH;

    const expires = moment().add(process.env.JWT_REFRESH_EXPIRATION_DAYS, 'days');
    const token = await this.generateToken({ device: deviceId, expires, sub: userId, type: tokenType });

    await this.saveToken({ device: deviceId, expires, type: tokenType, blacklisted: false, token, user: userId, session });

    return { token, expires: expires.toISOString() };
  }

  async getAndSaveResetPasswordToken(userId: Types.ObjectId, deviceId: Types.ObjectId = null, session: ClientSession = null): Promise<any> {
    const tokenType = config.TOKEN_TYPES.RESET_PASSWORD;

    const expires = moment().add(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES, 'minutes');
    const token = await this.generateToken({ device: deviceId, expires, sub: userId, type: tokenType });

    await this.saveToken({ device: deviceId, expires, type: tokenType, blacklisted: false, token, user: userId, session });

    return { token, expires };
  }

  async getAndSaveEmailVerificationToken(userId: Types.ObjectId, deviceId: Types.ObjectId = null, session: ClientSession = null): Promise<any> {
    try {
      const tokenType = config.TOKEN_TYPES.VERIFY_EMAIL;

      const expires = moment().add(process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES, 'minute');
      const token = await this.generateToken({ device: deviceId, expires, sub: userId, type: tokenType });

      await this.saveToken({ device: deviceId, expires, type: tokenType, blacklisted: false, token, user: userId, session });

      return { token, expires };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Remove all tokens for respective userId, deviceId and tokenType
   * @param param0 
   */

  async removeTokens({ user, device, type, session }: removeTokenDto): Promise<any> {
    const where = { user, device, type };

    const options = session || {}
    await this.tokenModel.deleteMany(where, options);
  }
}
