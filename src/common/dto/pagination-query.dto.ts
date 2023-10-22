import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }

export class PaginationQueryDto {
  @IsString()
  @IsOptional()
  sortKey: string;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder: string;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search: string;
}

export class ReturnQueryDto {
  @IsArray()
  @IsNotEmptyObject()
  results: object[];

  @IsNumber()
  @IsNotEmpty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsNumber()
  @IsNotEmpty()
  totalPages: number;

  @IsNumber()
  @IsNotEmpty()
  totalResults: number;
}
