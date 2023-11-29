import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import mongoose, { ObjectId, Types } from 'mongoose';

@Injectable()
export class CustomObjectId implements PipeTransform {
    async transform(value: string, metadata: ArgumentMetadata) {
        try {
            const object = plainToClass(Object, { id: value });
            const errors = await validate(object);

            if (errors.length > 0) {
                throw new BadRequestException('Invalid ObjectId');
            }

            return new Types.ObjectId(value);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
