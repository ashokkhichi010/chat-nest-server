import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
    isSeen: boolean | null | undefined
    seenAt: Date | string | null | undefined
    // isReceived: boolean | null | undefined
    // receivedAt: Date | string | null | undefined
    // isSent: boolean | null | undefined
    // sentAt: Date | string | null | undefined
}
