import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Observable, map } from 'rxjs';
import { LogsService } from './logs.service';
import { CreateLogDto } from './create-log.dto';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    private readonly i18n: I18nService,
    private readonly logService: LogsService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const lang = req.headers['lang'] || req.headers['locale-code'];

    return next.handle().pipe(
      map((returnObj) => {
        returnObj = typeof returnObj === 'string' ? { message: returnObj } : (returnObj as object);

        const { message, data } = returnObj;

        const response = {
          statusCode: res?.statusCode,
          message: (message && this.i18n.t(message, { lang })) || '',
          status: true,
          data: data || {},
        };

        const startTime = new Date(req._startTime);
        const endTime = new Date();
        const reqTime = endTime.getMilliseconds() - startTime.getMilliseconds();

        const logData: CreateLogDto = {
          uri: req?.originalUrl,
          headers: req?.headers,
          ipAddress: req?.ip,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          method: req?.method,
          body: req?.body,
          query: req?.query,
          params: req?.params,
          rtime: reqTime,
          status: res?.statusCode,
          response,
        };

        this.logService.create(logData);
        return response;
      }),
    );
  }
}
