import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { customConfig } from '../config/config';
import { UsersService } from '../users/users.service';
import { ROLES } from '../decorators/roles.decorator';

const config = customConfig()
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly reflector: Reflector, // private readonly userService: UsersService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>(ROLES, context.getHandler());

    if (!roles || !roles.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const [type, token] = req.headers['authorization']?.split(' ') ?? [];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });

      const user = await this.userService.getUserById(payload.sub);

      const userRole = user.role;
      if (!roles.includes(userRole)) {
        throw new UnauthorizedException("You don't have any required permissions for this action");
      }

      // ?💡 We're assigning the payload to the request object here
      // ?      so that we can access it in our route handlers
      req['user'] = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('messages.auth.please_authenticate');
    }
  }
}
