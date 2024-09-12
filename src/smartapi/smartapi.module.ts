import { Module } from '@nestjs/common';
import { SmartApiService } from './smartapi.service';
import { SmartApiController } from './smartapi.controller';

@Module({
  controllers: [SmartApiController],
  providers: [SmartApiService],
})
export class SmartApiModule { }
