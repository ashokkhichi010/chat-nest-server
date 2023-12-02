import { Types } from "mongoose";

export class CreateChessDto { }

export class ChessPieceDto {
    id: string;
    user: string;
    piece: string;
    index: number;
}

export class ChessMovePieceDto {
    connectionId: Types.ObjectId;
    playerId: Types.ObjectId;
    from: ChessPieceDto;
    to: ChessPieceDto;
    duration: number;
    moveTime: Date;
    capturedPiece: string
    chessBoard: ChessPieceDto[];
}