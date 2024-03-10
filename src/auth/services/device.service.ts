import { BadRequestException, Injectable } from '@nestjs/common';
import { Device } from '../entities/device.entity';
import { ClientSession, Model, ObjectId, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto, DeviceHeadersDto, GetDeviceDto, UpdateDeviceDto } from '../dto/device.dto';
import { TokenService } from './token.service';
import { customConfig } from '../../config/config';
import { UsersService } from 'src/users/users.service';

const config = customConfig()
@Injectable()
export class DeviceService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userService: UsersService,
    @InjectModel(Device.name) private deviceModel: Model<Device>) { }

  createDevice = async (deviceObj: CreateDeviceDto, session: ClientSession = null): Promise<Device | undefined> => {
    const options = {}
    session && (options["session"] = session);

    const device = await this.deviceModel.create([deviceObj], options);
    return device[0];
  }

  getDeviceById = async (id: Types.ObjectId): Promise<any> => await this.deviceModel.findById(id);

  getDeviceByUserId = async (userId: ObjectId): Promise<any> => await this.deviceModel.findOne({ userId });

  getDevice = async (where: GetDeviceDto): Promise<any> => await this.deviceModel.findOne(where);

  logoutDevice = async (deviceId: Types.ObjectId, session: ClientSession): Promise<Device | Error> => await this.updateDevice(deviceId, { lastLogout: new Date(), loginStatus: 'LOGOUT' }, session);

  async loginDevice(userId: Types.ObjectId, headers: DeviceHeadersDto, session: ClientSession = null): Promise<Device> {
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


  async updateDevice(deviceId: Types.ObjectId, updateOnj: UpdateDeviceDto, session: ClientSession = null): Promise<Device> {
    const device = await this.getDeviceById(deviceId);

    if (!device) {
      throw new BadRequestException(`Device Not found with ${deviceId} deviceId`);
    }

    Object.assign(device, updateOnj);
    const options = {}
    session && (options["session"] = session);
    return await device.save(options);
  }

  connectNewDevice = async (refreshToken: string, oldDeviceId: string, newClientId: string, newDeviceHeaders: DeviceHeadersDto, emitEvents: Function, saveClientData: Function) => {
    const token = await this.tokenService.verifyToken(refreshToken, config.TOKEN_TYPES.REFRESH);
    const userId = token.user;

    const user = await this.userService.getUserById(userId);
    if (!user) {
      return;
    }
    const device: Device = await this.loginDevice(user.id, newDeviceHeaders);
    const clientServerConnection = await saveClientData(user._id, device.id, newClientId);

    await this.tokenService.removeTokens({ user: user._id, device: device._id, session: null, type: null });

    let access = this.tokenService.getAccessToken(user._id, device._id);
    let refresh = this.tokenService.getAndSaveRefreshToken(user._id, device._id);

    [access, refresh] = await Promise.all([access, refresh]);

    emitEvents(user._id, "qr-code-response-new-device", { tokens: { access, refresh }, user, device }, null, device.id, () => { });
    emitEvents(user._id, "qr-code-response-old-device", { success: true }, null, oldDeviceId, () => { });
  }
}
