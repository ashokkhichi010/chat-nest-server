import * as moment from 'moment';
import { ObjectId, ClientSession, Types } from 'mongoose';

export class CreateTokenDto {
  token: string | String;
  user: Types.ObjectId;
  device: Types.ObjectId;
  type: string | String;
  expires: moment.Moment;
  blacklisted: Boolean = false;
  session: ClientSession = null
}

export class GenerateTokenDto {
  sub: Types.ObjectId;
  device: Types.ObjectId;
  type: string | String;
  expires: moment.Moment;
}