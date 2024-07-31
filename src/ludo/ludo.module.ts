import { Module } from '@nestjs/common';
import { LudoService } from './ludo.service';
import { LudoController } from './ludo.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketModule } from 'src/socket/socket.module';
import { ludoCollection, LudoConnection, ludoSchema } from './entities/ludo.entity';
import { LudoMove, ludoMoveCollection, ludoMoveSchema } from './entities/movePiece.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LudoConnection.name, schema: ludoSchema, collection: ludoCollection },
      { name: LudoMove.name, schema: ludoMoveSchema, collection: ludoMoveCollection },
    ]),
    SocketModule,
  ],
  controllers: [LudoController],
  providers: [LudoService],
  exports: [LudoService]
})
export class LudoModule {}
