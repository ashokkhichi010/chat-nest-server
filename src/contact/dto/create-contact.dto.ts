import { Types } from "mongoose";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { PartialType } from "@nestjs/mapped-types";
import { IsMongoId, IsNotEmpty, IsOptional } from "class-validator";

export class CreateContactDto { }

export class ContactListDto extends PartialType(PaginationQueryDto) {
  @IsMongoId()
  @IsOptional()
  userId: Types.ObjectId;
}

export class ParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  contactUser: Types.ObjectId
}