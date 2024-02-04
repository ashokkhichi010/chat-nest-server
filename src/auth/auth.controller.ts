import { Body, Controller, Headers, Post, NotFoundException, HttpCode, Get, Param, NotAcceptableException } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { DeviceService } from './services/device.service';
import { UsersService } from '../users/users.service';
import * as moment from 'moment';
import { ForgotPasswordBodyDto, LogoutBodyDto, ResetPasswordBodyDto, refreshTokensBodyDto } from './dto/create-auth.dto';
import { Device } from './entities/device.entity';
import { ClientSession, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { customConfig } from '../config/config';
import { ContactNumberDto } from 'src/users/users.dto';

const config = customConfig()

@Controller('auth')
export class AuthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,

    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    private readonly deviceService: DeviceService,
  ) { }

  @Post('register')
  @HttpCode(201)
  async register(@Headers() header: any, @Body() body: any) {
    const session: ClientSession = await this.connection.startSession();
    try {
      session.startTransaction();

      const user = await this.userService.create(body, session);
      const token = await this.tokenService.getAndSaveEmailVerificationToken(user._id, null, session);

      const { name, email } = user;

      let emailVerificationUrl = config.APP_URL + '/verify-email/' + token;

      const data = {
        receiver: { name, email },
        receiver_emails: [email],
        name: name,
        email_verification_url: emailVerificationUrl,
      };

      // emailService.sendVerificationEmail(data);
      await session.commitTransaction();

      return {
        data: { user, token },
        message: 'messages.auth.resendVerificationEmail',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Headers() header: any, @Body() body: any) {
    const session: ClientSession = await this.connection.startSession();
    try {
      session.startTransaction();
      const { email, password } = body;
      const user = await this.authService.loginWithUsernameAndPassword(email, password);

      const device: Device = await this.deviceService.loginDevice(user._id, header, session);

      await this.tokenService.removeTokens({ user: user._id, device: device._id, session, type: null });

      let access = this.tokenService.getAccessToken(user._id, device._id);
      let refresh = this.tokenService.getAndSaveRefreshToken(user._id, device._id);

      [access, refresh] = await Promise.all([access, refresh]);

      await session.commitTransaction();

      return {
        data: { user, tokens: { access, refresh }, device },
        message: 'messages.auth.loginSuccess',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() { refreshToken }: LogoutBodyDto) {
    const session: ClientSession = await this.connection.startSession();
    try {
      session.startTransaction();
      const { user, device } = await this.tokenService.verifyToken(refreshToken, config.TOKEN_TYPES.REFRESH);

      const userInfo = await this.userService.getUserById(user);
      if (!userInfo) {
        throw new NotFoundException('messages.user.notFound');
      }

      await this.deviceService.logoutDevice(device, session);
      await this.tokenService.removeTokens({ user, device, type: null, session });

      await session.commitTransaction();

      return { message: 'messages.device.deviceLogoutSuccess' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('refresh-tokens')
  @HttpCode(200)
  async refreshTokens(@Body() { refreshToken }: refreshTokensBodyDto) {
    const { user, device, expires } = await this.tokenService.verifyToken(refreshToken, config.TOKEN_TYPES.REFRESH);

    const tokens = {
      access: await this.tokenService.getAccessToken(user, device),
      refresh: { token: refreshToken, expires },
    };

    const expiryDate = moment(expires).subtract(1, 'days').format('YYYY-MM-DD');
    const currentDate = moment().format('YYYY-MM-DD');
    if (expiryDate === currentDate) {
      const refreshToken = await this.tokenService.getAndSaveRefreshToken(user, device);
      tokens.refresh = refreshToken;
    }

    return { data: tokens };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() { email }: ForgotPasswordBodyDto) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('messages.auth.emailNotFound');
    }
    const resetPasswordToken = await this.tokenService.getAndSaveResetPasswordToken(user._id);

    const data = {
      receiver: email,
      name: user.name,
      token: resetPasswordToken,
    };

    // emailService.sendResetPasswordEmail(data);
    return {
      message: 'messages.auth.forgotPasswordEmailSent',
      data: resetPasswordToken,
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() { token, password }: ResetPasswordBodyDto) {
    const session: ClientSession = await this.connection.startSession();
    try {
      session.startTransaction();
      const tokenType = config.TOKEN_TYPES.RESET_PASSWORD;

      const { user } = await this.tokenService.verifyToken(token, tokenType);

      await this.userService.updateUserById(user, { password }, session);
      await this.tokenService.removeTokens({ user, device: null, type: tokenType, session });

      await session.commitTransaction();
      return {
        message: "messages.auth.passwordResetSuccessfully"
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('is-credentials-already-used')
  @HttpCode(200)
  async check(@Body() body: { type: string, value: any }) {
    try {
      const type = body.type;
      const value = body.value;

      if (!["email", "contactNumber"].includes(type)) {
        throw new NotAcceptableException(`messages.auth.invaliedInputOfCheckEmailAndPhone`);
      }

      const user =
        type === 'email'
          ? await this.userService.getUserByEmail(value)
          : await this.userService.getUserByContactNumber(value);

      if (user) {
        throw new NotAcceptableException(`messages.auth.${type}AlreadyRegistered`);
      }

      return { message: 'messages.auth.success' };
    } catch (error) {
      throw error;
    }
  }
}
