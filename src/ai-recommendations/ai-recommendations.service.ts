import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIRecommendation } from './entities/ai-recommendation.entity';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';

@Injectable()
export class AIRecommendationsService {
  constructor(
    @InjectModel('AIRecommendation') private readonly recommendationModel: Model<AIRecommendation>
  ) { }

  // Create new recommendation
  async createRecommendation(createDto: CreateAiRecommendationDto): Promise<AIRecommendation> {
    const newRecommendation = new this.recommendationModel(createDto);
    return newRecommendation.save();
  }

  // Get recommendations for a user
  async getRecommendations(userId: string): Promise<AIRecommendation[]> {
    return this.recommendationModel.find({ userId }).exec();
  }
}
