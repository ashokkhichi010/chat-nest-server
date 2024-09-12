import { PartialType } from '@nestjs/swagger';
import { CreateTradingSimulationDto } from './create-trading-simulation.dto';

export class UpdateTradingSimulationDto extends PartialType(CreateTradingSimulationDto) {}
