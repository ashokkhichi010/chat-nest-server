import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

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
  @ApiProperty()
  "environment": string | undefined;

  @ApiProperty()
  "device-type": string | undefined;

  @ApiProperty()
  "device-name": string | undefined;

  @ApiProperty()
  "device-id": string | undefined;

  @ApiProperty()
  "device-token": string | undefined;

  @ApiProperty()
  "os-version": string | undefined;

  @ApiProperty()
  "ip-address": string | undefined;

}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) { }
