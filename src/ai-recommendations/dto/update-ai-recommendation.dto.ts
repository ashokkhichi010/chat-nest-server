import { PartialType } from '@nestjs/swagger';
import { CreateAiRecommendationDto } from './create-ai-recommendation.dto';

export class UpdateAiRecommendationDto extends PartialType(CreateAiRecommendationDto) {}
