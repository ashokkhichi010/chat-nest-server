import { Types } from "mongoose";

export class PlayerPieceDto {
    playerType: string;
    userId: Types.ObjectId;
    pieceValue: {
        1: number;
        2: number;
        3: number;
        4: number;
    }
}

export class PieceInfoDto {
    position: string;
    value: number;
}

export class LudoPlayer {
    type: string;
    name: string;
    image: string;
    userId: Types.ObjectId;
    deviceId: Types.ObjectId;
    is_computer: boolean;
    color: string;
    path_color: string;
};