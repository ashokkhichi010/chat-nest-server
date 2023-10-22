import { Injectable } from '@nestjs/common';
import { CreateLogDto } from './create-log.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Log } from './log.entity';
import { Model } from 'mongoose';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private readonly logModel: Model<Log>) {}

  async create(logObj: CreateLogDto): Promise<any> {
    return await this.logModel.create(logObj);
  }
}
