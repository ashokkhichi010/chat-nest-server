import { BadRequestException, Injectable } from '@nestjs/common';
import { Groups } from './entities/group.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Groups.name) private readonly groupsModel: Model<Groups>
  ) { }

  getGroupById = async (groupId: Types.ObjectId): Promise<Groups> => {
    const group: Groups = await this.groupsModel.findOne({ _id: groupId });

    if (!group) {
      throw new BadRequestException('messages.group.notFound');
    }

    return group;
  }

  saveGroup = async (groupData: CreateGroupDto) => await this.groupsModel.create(groupData);

  addMembers = async (groupId: Types.ObjectId, users: Types.ObjectId[]) => {
    const group = await this.getGroupById(groupId);

    users.forEach(val => group.members.includes(val) || group.members.push(val));
    return await group.save();
  }

  removeMembers = async (groupId: Types.ObjectId, users: Types.ObjectId[]) => {
    const group = await this.getGroupById(groupId);

    group.members = group.members.filter(member => !users.includes(member));
    group.admins = group.admins.filter(member => !users.includes(member));
    await group.save();
  }
}
