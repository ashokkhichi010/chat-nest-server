import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { User } from '../users/users.entity';

export const USER = 'user';

export const AuthUser = createParamDecorator((fields: Array<string>, context: ExecutionContext): User => {
  const { user } = context.switchToHttp().getRequest();

  if (!user) {
    throw new UnauthorizedException('User not found from @User Decorator');
  }

  return (!fields || !fields.length) ? user : fields.map((key) => user[key]);
});
