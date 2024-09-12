import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { SmartApiService } from './smartapi.service';

@Controller('smartapi')
export class SmartApiController {
  constructor(private readonly smartApiService: SmartApiService) { }

  @Get('market-data')
  async getMarketData(@Query('symbol') symbol: string) {
    return this.smartApiService.getMarketData(symbol);
  }

  @Post('place-order')
  async placeOrder(@Body() orderData: any) {
    return this.smartApiService.getMarketData(orderData);
  }
}

setTimeout(async () => {
  // const service = new SmartApiService()

  // const data = await service.getMarketData("");
}, 3000);