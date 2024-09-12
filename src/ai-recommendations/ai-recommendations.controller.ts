import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AIRecommendationsService } from './ai-recommendations.service';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';

@Controller('ai-recommendations')
export class AIRecommendationsController {
  constructor(private readonly aiRecommendationsService: AIRecommendationsService) { }

  @Post()
  create(@Body() createDto: CreateAiRecommendationDto) {
    return this.aiRecommendationsService.createRecommendation(createDto);
  }

  @Get(':userId')
  getRecommendations(@Param('userId') userId: string) {
    return this.aiRecommendationsService.getRecommendations(userId);
  }
}
