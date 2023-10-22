import { IsMongoId, IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { PartialType } from "@nestjs/mapped-types";

export class CreateMessageDto {
  sender: Types.ObjectId | string;
  receiver: Types.ObjectId | string;
  message: string | String;
  connectionId: string;
}

export class MessageListDto extends PartialType(PaginationQueryDto) {
  @IsMongoId()
  @IsOptional()
  userId: Types.ObjectId | null | undefined;

  @IsMongoId()
  @IsOptional()
  contactUser: Types.ObjectId | null | undefined;

  @IsString()
  @IsOptional()
  connectionId: string | null | undefined;
}