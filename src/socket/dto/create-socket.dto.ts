import { Types } from "mongoose";
import { ChessPieceDto } from "src/chess/dto/create-chess.dto";

export class CreateSocketDto { }

export class EmitEventDto {
    userId: Types.ObjectId;
    event: string;
    data: any;
    callback: Function | null = null;
    timeout: number = 2000;
    deviceId: Types.ObjectId = null;
}

export class MoveChessPieceDto {
    from: ChessPieceDto;
    to: ChessPieceDto;
    user: object;
    chessConnectionId: Types.ObjectId;
}