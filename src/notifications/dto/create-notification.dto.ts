import { PartialType } from "@nestjs/mapped-types";
import { Types } from "mongoose";

export class CreateNotificationDto {
    userId: Types.ObjectId;
    title: string;
    body: string;
}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
    isReceived: boolean | null | undefined;
    receivedAt: Date | null | undefined;
    isDeleted: boolean | null | undefined;
    deletedAt: Date | null | undefined;
}
