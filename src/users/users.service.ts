import { BadRequestException, Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model, ObjectId, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { CreateUserDto, UpdateUserDto, UserListDto } from './users.dto';
import { customConfig } from '../config/config';
import { contactCollection } from '../contact/entities/contact.entity';
import { ReturnQueryDto } from '../common/dto/pagination-query.dto';

const config = customConfig()

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

  hashPassword = async (password: string): Promise<string> => await bcrypt.hash(password, config.BCRYPT_SALT);

  getUserByEmail = async (email: string): Promise<User> => await this.userModel.findOne({ email });

  getUserById = async (id: Types.ObjectId | string): Promise<User | undefined> => {
    const users = await this.userModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $project: {
          image: { $cond: ["$image", "$image", "https://robohash.org/doloremquesintcorrupti.png"] },
          name: "$name",
          email: "$email",
          role: "$role",
        }
      }
    ]);

    return users[0];
  }
  create = async (newUserObj: CreateUserDto, session: mongoose.ClientSession = null): Promise<User> => {
    const isEmailExist = await this.getUserByEmail(newUserObj.email);

    if (isEmailExist) {
      throw new NotAcceptableException('messages.auth.alreadyRegistered');
    }

    newUserObj.password = await this.hashPassword(newUserObj.password);

    const options = { session } || {};
    const user = await this.userModel.create([newUserObj], options);
    return user[0]
  }

  getUsers = async (userListDto: UserListDto): Promise<ReturnQueryDto> => {
    const { page = 1, limit = 10, search, sortKey = "email", sortOrder = 1, userId } = userListDto;
    const skip = (page - 1) * limit;
    const userIdAsObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

    const where = { role: { $ne: 'admin' } };
    if (userIdAsObjectId) {
      where["_id"] = { $ne: userIdAsObjectId };
      // where['isActive'] = true
      where['isDeleted'] = false;
    }

    const sort = {};
    sortKey && (sort[sortKey] = sortOrder);

    if (search) {
      const searchItemsArray = ["name", "email", "number"];
      where['$or'] = searchItemsArray.map(item => ({ [item]: new RegExp(search, 'gi') }));
    }

    const contactLookupPipeline = [
      {
        $addFields: {
          connectionArray: {
            $sortArray: {
              input: [{ $toString: "$_id" }, userIdAsObjectId?.toString()],
              sortBy: 1
            },
          }
        }
      },
      {
        $lookup: {
          from: contactCollection,
          let: { connectionId: { $concat: [{ $arrayElemAt: ["$connectionArray", 0] }, "_", { $arrayElemAt: ["$connectionArray", 1] }] } },
          as: "contactInfo",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$connectionId", "$$connectionId"] },
                    { $eq: ["$isDeleted", false] }
                  ]
                }
              }
            },
            {
              $addFields: {
                isNewRequestFound: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ["$contactUser", userIdAsObjectId] },
                        { $eq: ["$status", "PENDING"] }
                      ]
                    },
                    then: 1,
                    else: 0
                  }
                }
              }
            },
            { $project: { __v: 0, } }
          ]
        }
      },
      { $unwind: { path: "$contactInfo", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$contactInfo", null] },
              { $ne: ["$contactInfo.status", "ACCEPTED"] }
            ]
          }
        }
      },
      // { $unset: "connectionId" },
    ];

    const projectPipeline = [{
      $project: {
        uid: "$uid",
        name: "$name",
        email: "$email",
        image: "$image",
        phoneNumber: "$phoneNumber",
        contactInfo: { $cond: ['$contactInfo', '$contactInfo', null] }
      }
    }];

    const groupByPendingRequest = [
      {
        $group: {
          _id: '$contactInfo.isNewRequestFound',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: 1
        }
      },
    ]

    let matchPipeline = userIdAsObjectId ? [{ $match: where }, ...contactLookupPipeline, ...projectPipeline] : [{ $match: where }, ...projectPipeline]

    const paginationPipeline: any = [
      ...matchPipeline,
      { $sort: { ...sort, createdAt: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]

    let [results, totalResults, newRequests]: [any, any, any] = await Promise.all([
      this.userModel.aggregate<any>(paginationPipeline).exec(),
      // this.userModel.countDocuments(matchPipeline).exec(),
      this.userModel.aggregate([...matchPipeline, { $count: "count" }]).exec(),
      this.userModel.aggregate([...matchPipeline, ...groupByPendingRequest]).exec(),
    ]);

    newRequests = newRequests.length ? newRequests[0].count : 0
    totalResults = totalResults[0]?.count || 0;

    const returnObj = {
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
      newRequests,
    };

    return returnObj;
  }

  updateUserById = async (userId: Types.ObjectId, where: UpdateUserDto, session: ClientSession = null): Promise<User | Error> => {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new BadRequestException('user not found');
    }

    if (where.password) {
      where.password = await this.hashPassword(where.password);
    }

    Object.assign(user, where);
    return await user.save({ session });
  }

  deleteUserById = async (userId: Types.ObjectId): Promise<User | Error> => /* return */await this.updateUserById(userId, { isDeleted: true, deletedAt: new Date() })
}
