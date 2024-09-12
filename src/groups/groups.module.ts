import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Groups, groupsCollection, groupsSchema } from './entities/group.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Groups.name, schema: groupsSchema, collection: groupsCollection },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
