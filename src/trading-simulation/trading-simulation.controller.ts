import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TradingSimulationService } from './trading-simulation.service';
import { CreateTradingSimulationDto } from './dto/create-trading-simulation.dto';
import { UpdateTradingSimulationDto } from './dto/update-trading-simulation.dto';

@Controller('trading-simulation')
export class TradingSimulationController {
  constructor(private readonly tradingSimulationService: TradingSimulationService) {}

  @Post()
  create(@Body() createTradingSimulationDto: CreateTradingSimulationDto) {
    return this.tradingSimulationService.create(createTradingSimulationDto);
  }

  @Get()
  findAll() {
    return this.tradingSimulationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tradingSimulationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTradingSimulationDto: UpdateTradingSimulationDto) {
    return this.tradingSimulationService.update(+id, updateTradingSimulationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tradingSimulationService.remove(+id);
  }
}
