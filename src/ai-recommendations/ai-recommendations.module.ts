import { Module } from '@nestjs/common';
import { AIRecommendationsController } from './ai-recommendations.controller';
import { AIRecommendationsService } from './ai-recommendations.service';
import { AIRecommendation, aiRecommendationCollection, aiRecommendationSchema } from './entities/ai-recommendation.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIRecommendation.name, schema: aiRecommendationSchema, collection: aiRecommendationCollection }
    ])
  ],
  controllers: [AIRecommendationsController],
  providers: [AIRecommendationsService],
})
export class AiRecommendationsModule { }
