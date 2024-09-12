import { PartialType } from '@nestjs/swagger';
import { CreatePortfolioDto } from './portfolio.dto';

export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {}
