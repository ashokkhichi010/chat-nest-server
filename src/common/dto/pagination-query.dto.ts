import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNotEmptyObject, IsNumber,  IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }

export class PaginationQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Key to sort the results by', example: 'createdAt' })
  sortKey?: string;

  @IsEnum(SortOrder)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Order to sort the results in', enum: SortOrder, example: SortOrder.ASC })
  sortOrder?: SortOrder;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number to retrieve', default: 1, example: 1 })
  page: number = 1;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, example: 10 })
  limit: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search query string', example: 'keyword' })
  search?: string;
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
