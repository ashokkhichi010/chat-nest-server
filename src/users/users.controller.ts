import { Body, Controller, Get, Param, Post, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserListDto } from './users.dto';
import { Types } from 'mongoose';
import { Roles } from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/user.decorator';
import { User } from './users.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) { }

  @Roles('admin', 'user')
  @Post('/list')
  @HttpCode(200)
  async getUsers(@AuthUser() user: User, @Body() userListDto: UserListDto): Promise<object | undefined> {
    const userId = user.id;
    const users = await this.userService.getUsers({ ...userListDto, userId });
    return { data: users, message: 'success' };
  }

  @Roles('admin')
  @Post('/add')
  async createUser(@Body() body: CreateUserDto): Promise<object | undefined> {
    body['isEmailVerified'] = true;
    body['isActive'] = true;
    const user = await this.userService.create(body);

    // send welcome email to user

    return { data: user };
  }

  @Roles('admin')
  @Get(':userId')
  async getUser(@Param() userId: Types.ObjectId): Promise<object | undefined> {
    return { message: "", data: await this.userService.getUserById(userId) };
  }

  @Roles('admin')
  @Post(':userId')
  async updateUser(@Param() userId: Types.ObjectId, @Body() { name, contactNumber }: UpdateUserDto): Promise<object | undefined> {
    await this.userService.updateUserById(userId, { name, contactNumber });
    return { message: 'messages.user.updated' };
  }

  @Roles('admin')
  @Post(':userId')
  async deleteUser(@Param() userId: Types.ObjectId): Promise<object | undefined> {
    await this.userService.deleteUserById(userId);
    return { message: 'messages.user.deleted' };
  }
}
