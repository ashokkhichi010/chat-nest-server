import { ForbiddenException, Injectable, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
  ) { }

  async loginWithUsernameAndPassword(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);

    // if () {
    //   throw new NotFoundException('messages.user.notFound');
    // } else
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ForbiddenException('messages.auth.invalidCredentials');
    } else if (!user.isActive) {
      throw new UnauthorizedException('messages.auth.emailVerificationRequired');
    } else if (user.isDeleted) {
      throw new NotAcceptableException('messages.user.accountDeleted');
    }

    return user;
  }

  logout() { }

  refreshTokens() { }
}
