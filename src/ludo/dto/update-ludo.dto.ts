import { PartialType } from '@nestjs/mapped-types';
import { CreateLudoDto } from './create-ludo.dto';

export class UpdateLudoDto extends PartialType(CreateLudoDto) {}
