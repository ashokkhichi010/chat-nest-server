import { Types } from "mongoose";

export class CreateSocketDto { }

export class EmitEventDto {
    userId: Types.ObjectId;
    event: string;
    data: any;
    callback: Function | null = null;
    timeout: number = 2000;
    deviceId: Types.ObjectId = null;
}