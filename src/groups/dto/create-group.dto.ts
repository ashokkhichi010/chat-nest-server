import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";

export class BodyGroupDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    image: string;

    @IsMongoId()
    @IsOptional()
    @IsArray()
    members: Types.ObjectId[];
}

export class CreateGroupDto {
    name: string;
    description: string;
    image: string;
    members: Types.ObjectId[];
    owner: string;
    admins: Types.ObjectId[];
}
