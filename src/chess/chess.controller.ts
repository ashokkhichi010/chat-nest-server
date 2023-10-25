import { Controller, Get, Param } from '@nestjs/common';
import { ChessService } from './chess.service';
import { Roles } from '../decorators/roles.decorator';
import { ContactService } from '../contact/contact.service';

@Controller('chess')
export class ChessController {
  constructor(
    private readonly chessService: ChessService,
    private readonly contactService: ContactService
  ) { }

  // @Roles('user')
  // @Get('connect/:contactUser')
  // async getConnect(@AuthUser() user: User, @Param() params: { contactUser: ObjectId }) {
  //   const { contactUser } = params;
  //   const userId = user.id;

  //   await this.contactService.isContactExist(userId, contactUser);

  //   const result = await this.chessService.connect(userId, contactUser);

  //   // await emitEventToClient(contactUser, 'chess-connection-request', emitEvent, result.toObject())

  //   return {
  //     message: "",
  //     ...result
  //   }
  // }

  // @Roles('user')
  // @Get(':connectionId/accept')
  // async acceptConnection(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const { connectionId } =params;
  //   const userId =user.id;

  //   const result = await chessService.accept(userId, connectionId);
  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), result);
  // }

  // @Roles('user')
  // @Get(':connectionId/cancel')
  // async cancelConnection(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const { connectionId } =params;
  //   const userId =user.id;

  //   const result = await chessService.cancel(userId, connectionId);

  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), result);
  // }

  // @Roles('user')
  // @Get(':connectionId/reject')
  // async rejectConnection(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const { connectionId } =params;
  //   const userId =user.id;

  //   const result = await chessService.reject(userId, connectionId);

  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), result);
  // }

  // @Roles('user')
  // @Get(':connectionId/get-suggestion')
  // async suggestions(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const { piece, user, index } =body;
  //   // const square = await

  //   let suggestionResult;

  //   switch (piece) {
  //     case 'r': {
  //       suggestionResult = chessService.rPiece(index, user, square);
  //       break;
  //     }
  //     case 'n': {
  //       suggestionResult = chessService.nPiece(index, user, square);
  //       break;
  //     }
  //     case 'b': {
  //       suggestionResult = chessService.bPiece(index, user, square);
  //       break;
  //     }
  //     case 'q': {
  //       suggestionResult = chessService.qPiece(index, user, square);
  //       break;
  //     }
  //     case 'k': {
  //       suggestionResult = chessService.kPiece(index, user, square);
  //       break;
  //     }
  //     case 'p': {
  //       suggestionResult = chessService.pPiece(index, user, square);
  //       break;
  //     }
  //   }

  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), suggestionResult);
  // }

  // @Roles('user')
  // @Get(':connectionId/move')
  // async movePiece(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const userId =user.id;
  //   const { connectionId } =params;
  //   const { from, to } =body;

  //   const result = await chessService.move(userId, connectionId, from, to, lang);

  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), result);
  // }
}
