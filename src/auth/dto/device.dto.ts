import { PartialType } from '@nestjs/mapped-types';
import { ObjectId, Types } from 'mongoose';

export class CreateDeviceDto {
  userId: Types.ObjectId;
  appEnvironment: string;
  deviceType: string;
  deviceName: string;
  deviceId: string;
  deviceToken: string;
  osVersion: string;
  ipAddress: string;
  lastLogin: Date | string | null | undefined = null;
  lastLogout: Date | string | null | undefined = null;
  loginStatus: string | null | undefined = null;
}

export class GetDeviceDto {
  deviceName: string;
  deviceType: string;
  deviceId: string;
}

export class DeviceHeadersDto {
  "environment": string | undefined;
  "device-type": string | undefined;
  "device-name": string | undefined;
  "device-id": string | undefined;
  "device-token": string | undefined;
  "os-version": string | undefined;
  "ip-address": string | undefined;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) { }
