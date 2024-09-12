import { Module } from '@nestjs/common';
import { TradingSimulationService } from './trading-simulation.service';
import { TradingSimulationController } from './trading-simulation.controller';

@Module({
  controllers: [TradingSimulationController],
  providers: [TradingSimulationService],
})
export class TradingSimulationModule {}
