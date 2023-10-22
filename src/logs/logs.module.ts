import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, logCollection, logSchema } from './log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: logSchema, collection: logCollection },
    ]),
  ],
  controllers: [],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
