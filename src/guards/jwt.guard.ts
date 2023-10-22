import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES } from '../decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector, // private readonly userService: UsersService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log('from jwt guard');
    const roles = this.reflector.get<string[]>(ROLES, context.getHandler());

    if (!roles || !roles.length) {
      return true;
    }

    return super.canActivate(context);
  }
}
