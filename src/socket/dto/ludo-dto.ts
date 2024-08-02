import { Types } from "mongoose";

export class LudoRollDiceDto {
  ludoConnectionId: Types.ObjectId;
  playerType: string;
}

export class LudoMovePieceDto {
  ludoConnectionId: Types.ObjectId;
  playerType: string;
  pieceIndex: string;
}

export class LudoUpdatePieceDto {
  ludoConnectionId: Types.ObjectId;
  updatedPieces: object;
}
