import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { UsersService } from '../users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userCollection, userSchema } from '../users/users.entity';
import { Token, tokenCollection, tokenSchema } from './entities/token.entity';
import { Device, deviceCollection, deviceSchema } from './entities/device.entity';
import { JwtStrategy } from './jwt.strategy';
import { DeviceService } from './services/device.service';
import { customConfig } from '../config/config';

const config = customConfig()

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: userSchema, collection: userCollection },
            { name: Token.name, schema: tokenSchema, collection: tokenCollection },
            { name: Device.name, schema: deviceSchema, collection: deviceCollection },
        ]),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenService, UsersService, JwtStrategy, DeviceService],
    exports: [TokenService, DeviceService]
})
export class AuthModule { }
