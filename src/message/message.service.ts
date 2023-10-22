import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MessageListDto, CreateMessageDto } from './dto/create-message.dto';
import { Model, PipelineStage, Types } from 'mongoose';
import { Message } from './entities/message.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnQueryDto } from '../common/dto/pagination-query.dto';
import { getConnectionId } from 'src/utils/getConnectionId';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>
  ) { }

  createMessage = async (messageObj: CreateMessageDto): Promise<Message> => {
    try {
      const messageBody = {
        ...messageObj,
        receiver: new Types.ObjectId(messageObj.receiver),
        isSent: true,
        sentAt: new Date().toISOString(),
      };

      return await this.messageModel.create(messageBody);
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  };

  getMessages = async (filter: MessageListDto): Promise<ReturnQueryDto> => {
    const { userId, contactUser, page = 1, limit = 10, search, sortKey = '_id', sortOrder = "DESC", connectionId } = filter;
    const skip = (page - 1) * limit;

    const match: any = { connectionId: connectionId || getConnectionId(userId, contactUser) };

    if (search) {
      match['$or'].push({ message: new RegExp(search, 'i') });
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $project: { __v: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    let [results, totalResults]: [any, any] = await Promise.all([
      this.messageModel.aggregate<PipelineStage>(pipeline).exec(),
      this.messageModel.countDocuments(match).exec(),
    ]);

    // results = results.map(async (message: Message) => {

    //   const updateMessage = {
    //     isReceived: true,
    //     receivedAt: new Date().toISOString()
    //   }
    //   if (!message?.isReceived && message.receiver.toString() === userId.toString()) {
    //     Object.assign(message, updateMessage)
    //     await message.save()
    //     console.log("🚀 ~ file: message.service.ts:61 ~ MessageService ~ results=results.map ~ message:", message)
    //   }

    //   return message;
    // })

    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      page,
      limit,
      totalPages,
      totalResults,
    };
  }

  getNewMessages = async (userId: Types.ObjectId) => {
    console.log("🚀 ~ file: message.service.ts:80 ~ MessageService ~ getNewMessages= ~ userId:", userId)
    const where = {
      receiver: userId,
      // isReceived: false
    };
    console.log("🚀 ~ file: message.service.ts:85 ~ MessageService ~ getNewMessages= ~ where:", where)

    const update = {
      isReceived: true,
      receivedAt: new Date().toISOString()
    }

    const newMessages = await this.messageModel.find(where);
    console.log("🚀 ~ file: message.service.ts:91 ~ MessageService ~ getNewMessages= ~ newMessages:", newMessages)
  }

  updateMessage = async (messageId: Types.ObjectId, updateBody: Types.ObjectId) => {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('messages.message.notFound')
    }

    Object.assign(message, updateBody);
    await message.save();
    return message;
  };

  deleteMessage = async (userId: Types.ObjectId, contactUser: Types.ObjectId, messageId: Types.ObjectId) => {
    const messageData = await this.messageModel.findById(messageId);

    if (!messageData) {
      throw new NotFoundException('messages.message.notFound');
    } else if (messageData.isDeleted) {
      throw new BadRequestException("messages.message.alreadyDeleted");
    }

    const sender = messageData.sender;
    const receiver = messageData.receiver;

    if (userId !== sender && contactUser !== receiver) {
      throw new UnauthorizedException("messages.message.unauthorized")
    }

    const updateBody = {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    };

    Object.assign(messageData, updateBody);
    await messageData.save();

    return messageData;
  };
}
