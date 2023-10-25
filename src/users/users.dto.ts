import { PartialType } from '@nestjs/mapped-types';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  mobileNumber: Number;
  role: string | null | undefined;
  isEmailVerified: boolean | null | undefined;
  isActive: boolean | null | undefined;
  isDeleted: boolean | null | undefined;
  deletedAt: Date | null | undefined;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class UserListDto extends PartialType(PaginationQueryDto) {
  userId: Types.ObjectId | undefined
}
