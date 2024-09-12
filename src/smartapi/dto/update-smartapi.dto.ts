import { PartialType } from '@nestjs/swagger';
import { CreateSmartapiDto } from './create-smartapi.dto';

export class UpdateSmartapiDto extends PartialType(CreateSmartapiDto) {}
