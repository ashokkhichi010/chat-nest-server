import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { CreateLogDto } from './create-log.dto';
import { LogsService } from './logs.service';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class LogExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logService: LogsService,
    private readonly i18n: I18nService,
  ) { }

  catch(exception: any, host: ArgumentsHost) {
    console.log("i'm an exception");
    const [req] = host.getArgs();
    const res = host.switchToHttp().getResponse<Response>();

    let statusCode = 400;
    let message = 'This is custom message which is changeable according to requirement';

    if (exception instanceof HttpException) {
      statusCode = exception?.getStatus() || statusCode;
      message = exception?.message || message;
    } else {
      statusCode = exception?.status || statusCode;
      message = exception?.message || message;
    }

    const lang = req.headers['lang'] || req.headers['locale-code'];

    const response = {
      statusCode: statusCode,
      message: this.i18n.t(message, { lang }),
      status: false,
      data: {},
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
      status: statusCode,
      response,
    };

    this.logService.create(logData);
    res.status(statusCode).json(response);
  }
}
