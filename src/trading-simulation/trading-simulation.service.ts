import { Injectable } from '@nestjs/common';
import { CreateTradingSimulationDto } from './dto/create-trading-simulation.dto';
import { UpdateTradingSimulationDto } from './dto/update-trading-simulation.dto';

@Injectable()
export class TradingSimulationService {
  create(createTradingSimulationDto: CreateTradingSimulationDto) {
    return 'This action adds a new tradingSimulation';
  }

  findAll() {
    return `This action returns all tradingSimulation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tradingSimulation`;
  }

  update(id: number, updateTradingSimulationDto: UpdateTradingSimulationDto) {
    return `This action updates a #${id} tradingSimulation`;
  }

  remove(id: number) {
    return `This action removes a #${id} tradingSimulation`;
  }
}
