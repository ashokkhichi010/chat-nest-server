import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LogInterceptor } from './logs/log.interceptor';
import { LogsModule } from './logs/logs.module';
import { AuthGuard } from './guards/auth.guard';
import { LogExceptionFilter } from './logs/exception.filter';
import { ChessModule } from './chess/chess.module';
import { CommonModule } from './common/common.module';
import { ContactModule } from './contact/contact.module';
import { customConfig } from './config/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MessageModule } from './message/message.module';
import { SocketModule } from './socket/socket.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroupsModule } from './groups/groups.module';

const config = customConfig()

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => process.env] }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: join(__dirname, '../src/i18n/'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang', 'local'] },
                AcceptLanguageResolver,
            ],
        }),
        MongooseModule.forRoot(process.env.MONGODB_URL),
        // MongooseModule.forRoot(new ConfigService().getOrThrow("MONGODB_URL")),
        SocketModule,
        LogsModule,
        AuthModule,
        UsersModule,
        MessageModule,
        ChessModule,
        CommonModule,
        ContactModule,
        NotificationsModule,
        GroupsModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: LogInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
            // useClass: JwtAuthGuard,
        },
        {
            provide: APP_FILTER,
            useClass: LogExceptionFilter,
        },
    ],
})
export class AppModule { }
