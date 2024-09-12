import { Controller, Post, Body, Put } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { BodyGroupDto } from './dto/create-group.dto';
import { User } from 'src/users/users.entity';
import { AuthUser } from 'src/decorators/user.decorator';
import { Types } from 'mongoose';
import { SocketGateway } from 'src/socket/socket.gateway';
import { EmitEventDto } from 'src/socket/dto/create-socket.dto';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly socketGateway: SocketGateway,
  ) { }

  @Post('create')
  create(@AuthUser() user: User, @Body() body: BodyGroupDto) {
    const groupOwner = user._id;

    const groupData = {
      name: body.name,
      description: body.description,
      image: body.image,
      owner: groupOwner,
      members: [groupOwner, ...body.members],
      admins: [groupOwner],
    };

    return this.groupsService.saveGroup(groupData);
  }

  @Post("add-users")
  async addUsers(@Body() body: { groupId: Types.ObjectId, users: Types.ObjectId[] }) {
    const group = await this.groupsService.addMembers(body.groupId, body.users);
    const data = { groupName: group.name, };

    const emitLudoDiceRollingEvent = new EmitEventDto();

    emitLudoDiceRollingEvent.users = body.users;
    emitLudoDiceRollingEvent.event = 'new-group';
    emitLudoDiceRollingEvent.data = data;

    await this.socketGateway.emitEvents(emitLudoDiceRollingEvent);
  }
}
