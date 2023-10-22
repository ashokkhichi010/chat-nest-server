import { BadRequestException, Injectable } from '@nestjs/common';
import { Device } from '../entities/device.entity';
import { ClientSession, Model, ObjectId, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto, DeviceHeadersDto, GetDeviceDto, UpdateDeviceDto } from '../dto/device.dto';

@Injectable()
export class DeviceService {
  constructor(@InjectModel(Device.name) private deviceModel: Model<Device>) { }

  createDevice = async (deviceObj: CreateDeviceDto, session: ClientSession): Promise<Device | undefined> => {
    const device = await this.deviceModel.create([deviceObj], { session })
    return device[0];
  }

  getDeviceById = async (id: Types.ObjectId): Promise<any> => await this.deviceModel.findById(id);

  getDeviceByUserId = async (userId: ObjectId): Promise<any> => await this.deviceModel.findOne({ userId });

  getDevice = async (where: GetDeviceDto): Promise<any> => await this.deviceModel.findOne(where);

  logoutDevice = async (deviceId: Types.ObjectId, session: ClientSession): Promise<Device | Error> => await this.updateDevice(deviceId, { lastLogout: new Date(), loginStatus: 'LOGOUT' }, session);

  async loginDevice(userId: Types.ObjectId, headers: DeviceHeadersDto, session: ClientSession): Promise<Device> {
    const appEnvironment = headers['environment'];
    const deviceType = headers['device-type'];
    const deviceName = headers['device-name'];
    const deviceId = headers['device-id'];
    const deviceToken = headers['device-token'];
    const osVersion = headers['os-version'];
    const ipAddress = headers['ip-address'] || '::1';

    let device: Device = await this.getDevice({ deviceName, deviceType, deviceId });

    const loginInfo = { lastLogin: new Date(), loginStatus: 'LOGIN' };
    const newDeviceInfo = { userId, appEnvironment, deviceType, deviceName, deviceId, deviceToken, osVersion, ipAddress, ...loginInfo, lastLogout: null };

    if (device) {
      device = await this.updateDevice(device.id, loginInfo, session);
    } else {
      device = await this.createDevice(newDeviceInfo, session);
    }

    return device
    // return device
  }


  async updateDevice(deviceId: Types.ObjectId, updateOnj: UpdateDeviceDto, session: ClientSession): Promise<Device> {
    const device = await this.getDeviceById(deviceId);

    if (!device) {
      throw new BadRequestException(`Device Not found with ${deviceId} deviceId`);
    }

    Object.assign(device, updateOnj);
    return await device.save({ session });
  }
}
