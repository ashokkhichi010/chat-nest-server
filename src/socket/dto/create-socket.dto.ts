import { Types } from "mongoose";
import { ChessPieceDto } from "src/chess/dto/create-chess.dto";

export class CreateSocketDto { }

export class EmitEventDto {
    event: string;
    data: any;
    users?: Types.ObjectId[] = [];
    devices?: Types.ObjectId[] = [];
    timeout?: number = 2000;
}

export class MoveChessPieceDto {
    from: ChessPieceDto;
    to: ChessPieceDto;
    user: object;
    chessConnectionId: Types.ObjectId;
}