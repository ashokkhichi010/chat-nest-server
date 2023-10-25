import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Contact, contactCollection } from './entities/contact.entity';
import mongoose, { Connection, Model, ObjectId, Types } from 'mongoose';
import { ContactListDto } from './dto/create-contact.dto';
import { Message, messageCollection } from '../message/entities/message.entity';
import { User, userCollection } from '../users/users.entity';
import { ReturnQueryDto } from '../common/dto/pagination-query.dto';
import { socketConnectionCollection } from '../socket/entities/socketConnection.entity';
import { getConnectionId } from '../utils/getConnectionId';

@Injectable()
export class ContactService {
  constructor(
    @InjectConnection() private readonly connection: Connection,

    @InjectModel(Contact.name) private readonly contactModel: Model<Contact>,
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) { }

  isContactExist = async (connectionId: string) => {
    const contact = await this.contactModel.findOne({ connectionId, status: 'ACCEPTED' });
    if (!contact) {
      throw new NotFoundException('messages.contact.notFound')
    }
    return contact;
  };

  getContact = async (userId: Types.ObjectId, contactUser: Types.ObjectId): Promise<Contact> => {
    const connectionId = getConnectionId(userId, contactUser);

    const where = {
      connectionId,
      userId: new mongoose.Types.ObjectId(userId),
      contactUser: new mongoose.Types.ObjectId(contactUser),
      isDeleted: false
    }

    return await this.contactModel.findOne(where);
  }

  getContacts = async (filter: ContactListDto): Promise<ReturnQueryDto> => {
    const { limit = 10, page = 1, search, sortKey, sortOrder, userId } = filter
    const userIdAsObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const searchMatch = {};
    if (search) {
      const searchItemArray = ['name', 'email'];
      search['$or'] = searchItemArray.map(item => ({ [item]: new RegExp(search, 'i') }))
    }

    const pipeline: any[] = [
      { $match: { _id: { $ne: userIdAsObjectId }, isDeleted: false } },
      { $match: searchMatch },
      {
        $lookup: {
          from: contactCollection,
          let: { contactUser: "$_id" },
          as: "contactInfo",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$userId", "$$contactUser"] },
                        { $eq: ["$contactUser", "$$contactUser"] },
                      ],
                    },
                    {
                      $or: [
                        { $eq: ["$userId", userIdAsObjectId] },
                        { $eq: ["$contactUser", userIdAsObjectId] },
                      ],
                    },
                    { $eq: ["$status", "ACCEPTED"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $addFields: {
                isNewContact: {
                  $cond: {
                    if: { $ne: ["$lastMessage", null] },
                    then: 0,
                    else: 1
                  }
                }
              }
            },
            {
              $project: {
                // _id: "$_id",
                // connectionId: "$connectionId",
                // userId: "$userId",
                // contactUser: "$contactUser",
                // status: "$status",
                // isAccepted: "$isAccepted",
                // isRejected: "$isRejected",
                // isCanceled: "$isCanceled",
                // lastMessage: "$lastMessage",
                // isNewContact: "$isNewContact",
                // createdAt: "$createdAt",
                // updatedAt: "$updatedAt",
                __v: 0
              }
            }
          ],
        },
      },
      {
        $unwind: {
          path: '$contactInfo',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: socketConnectionCollection,
          let: { contactUser: "$_id" },
          as: "onlineStatus",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$contactUser",], },
                    // { $eq: ["$status", "CONNECTED"] },
                  ],
                },
              },
            },
            {
              $project: {
                // _id: "$_id",
                // userId: "$userId",
                // deviceId: "$deviceId",
                // clientId: "$clientId",
                // status: "$status",
                // createdAt: "$createdAt",
                // updatedAt: "$updatedAt",
                __v: 0
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
        },
      },
      {
        $unwind: {
          path: '$onlineStatus',
          preserveNullAndEmptyArrays: true,
        },
      },
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
          from: messageCollection,
          let: { connectionId: { $concat: [{ $arrayElemAt: ["$connectionArray", 0] }, "_", { $arrayElemAt: ["$connectionArray", 1] }] } },
          as: "messages",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$connectionId", "$$connectionId"] },
                  ],
                },
              },
            },
            {
              $facet: {
                lastMessage: [
                  {
                    $sort: {
                      createdAt: -1
                    }
                  },
                  {
                    $limit: 1
                  }
                ],
                unSeenMessages: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $ne: [userIdAsObjectId, '$sender'] },
                          { $eq: ["$isSeen", false] }
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      count: { $sum: 1 }
                    }
                  },
                ]
              }
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$messages',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$messages.lastMessage',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$messages.unSeenMessages',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: "$name",
          email: "$email",
          image: "$image",
          contactInfo: "$contactInfo",
          onlineStatus: "$onlineStatus",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          lastMessage: { $cond: ["$messages.lastMessage", "$messages.lastMessage", {}] },
          unSeenMessages: { $cond: ["$messages.unSeenMessages.count", "$messages.unSeenMessages.count", 0] },
          lastMessageCreatedAt: { $cond: ["$messages.lastMessage.createdAt", "$messages.lastMessage.createdAt", null] },
        }
      }
    ];

    const groupByPendingRequest = [
      {
        $group: {
          _id: '$contactInfo.isNewContact',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: 1
        }
      },
    ];

    const paginationPipeline: any[] = [
      ...pipeline,
      { $sort: { "lastMessageCreatedAt": -1 } },
      { $skip: skip },
      { $limit: limit },
    ]

    let [results, totalResults, newContacts]: [any, any, any] = await Promise.all([
      this.userModel.aggregate<any>(paginationPipeline).exec(),
      // this.userModel.aggregate(pipeline).exec(),
      this.userModel.aggregate([...pipeline, { $count: "count" }]).exec(),
      this.userModel.aggregate([...pipeline, ...groupByPendingRequest]).exec(),
    ]);

    newContacts = newContacts.length ? newContacts[0].count : 0
    totalResults = totalResults[0]?.count || 0;

    const returnObj = {
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
      newContacts,
    };

    return returnObj;
  };

  sendRequest = async (userId: Types.ObjectId, contactUser: Types.ObjectId) => {
    const contact = await this.getContact(userId, contactUser)

    let isRequestPending = contact && contact.status === 'PENDING';
    let isRequestAccepted = (contact && contact.status === 'ACCEPTED');
    let isRequestRejected = contact && contact.status === 'REJECTED';

    if (isRequestAccepted) {
      throw new BadRequestException('messages.CONNECTION_ALREADY_EXIST');
    } else if (isRequestPending) {
      throw new BadRequestException('messages.REQUEST_ALREADY_SENT');
    } else if (isRequestRejected) {
      throw new BadRequestException('messages.REQUEST_ALREADY_REJECTED');
    }

    const requestResult = await this.createContact(userId, contactUser);

    return requestResult;
  };

  acceptRequest = async (userId: Types.ObjectId, contactUser: Types.ObjectId) => {
    const contact = await this.getContact(contactUser, userId);

    if (!contact) {
      throw new BadRequestException('messages.REQUEST_NOT_FOUND');
    } else if (contact.status === 'ACCEPTED') {
      throw new BadRequestException('messages.CONNECTION_ALREADY_EXIST');
    } else if (contact.status === 'CANCELED') {
      throw new BadRequestException('messages.REQUEST_ALREADY_CANCELED');
    }

    const commonContactObj = {
      isAccepted: true,
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString()
    };

    Object.assign(contact, commonContactObj);
    await contact.save();

    return contact;
  };

  cancelRequest = async (userId: Types.ObjectId, contactUser: Types.ObjectId) => {
    const contact = await this.getContact(userId, contactUser);

    if (!contact) {
      throw new BadRequestException('messages.REQUEST_NOT_FOUND');
    } else if (contact.status === 'ACCEPTED') {
      throw new BadRequestException('messages.CONNECTION_ALREADY_EXIST');
    } else if (contact.status === 'REJECTED') {
      throw new BadRequestException('messages.REQUEST_ALREADY_REJECTED');
    }

    const updateBody = {
      isCanceled: true,
      status: 'CANCELED',
      canceledAt: new Date().toISOString(),
    };

    Object.assign(contact, updateBody);
    await contact.save();
    return;
  };

  rejectRequest = async (userId: Types.ObjectId, contactUser: Types.ObjectId) => {
    const contact = await this.getContact(contactUser, userId);

    if (!contact) {
      throw new BadRequestException('messages.REQUEST_NOT_FOUND');
    } else if (contact.status === 'ACCEPTED') {
      throw new BadRequestException('messages.CONNECTION_ALREADY_EXIST');
    } else if (contact.status === 'CANCELED') {
      throw new BadRequestException('messages.REQUEST_ALREADY_CANCELED');
    }

    const updateBody = {
      isRejected: true,
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
    };

    Object.assign(contact, updateBody);
    await contact.save();
  };

  createContact = async (userId: Types.ObjectId, contactUser: Types.ObjectId) => {
    const connectionId = getConnectionId(userId, contactUser);
    const where = {
      connectionId,
      userId: new Types.ObjectId(userId),
      contactUser: new Types.ObjectId(contactUser)
    }

    let contact = await this.contactModel.findOne({ connectionId, isDeleted: false });

    if (contact) {
      const updateBody = {
        status: 'DELETED',
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      };

      Object.assign(contact, updateBody);
      await contact.save();
    }

    return await this.contactModel.create(where);
  }

  updateLastMessage = async (userId: string, contactUser: string | Types.ObjectId, messageObj: Message) => {
    const connectionId = getConnectionId(userId, contactUser);

    const connect = await this.isContactExist(connectionId);

    connect.lastMessage = messageObj.toObject();
    return await connect.save();
  }

  getContacts2 = async (filter: ContactListDto) => {
    const { limit = 10, page = 1, search, sortKey, sortOrder, userId } = filter
    // const userId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const searchMatch = {};
    if (search) {
      const searchItemArray = ['userInfo.name', 'userInfo.email'];
      searchMatch['$or'] = searchItemArray.map(item => ({ [item]: new RegExp(search, 'i') }))
    }

    const pipeline = [
      {
        $match: {
          status: "ACCEPTED",
          $or: [
            { userId: userId },
            { contactUser: userId }
          ]
        }
      },
      {
        $lookup: {
          from: userCollection,
          let: {
            contactUser: {
              $cond: {
                if: { $eq: [userId, "$userId"] },
                then: "$contactUser",
                else: "$userId"
              }
            }
          },
          as: "userInfo",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$_id" }, "$$contactUser"]
                }
              }
            },
          ]
        }
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: searchMatch },
      {
        $lookup: {
          from: socketConnectionCollection,
          let: { userId: "$userId" },
          as: "onlineStatus",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$userId", "$$userId"]
                }
              }
            },
          ]
        }
      },
      {
        $unwind: {
          path: "$onlineStatus",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    const projectPipeline = [
      {
        $project: {
          contactInfo: {
            _id: "$_id",
            connectionId: "$connectionId",
            acceptedAt: "$acceptedAt",
            canceledAt: "$canceledAt",
            contactUser: "$contactUser",
            createdAt: "$createdAt",
            isAccepted: "$isAccepted",
            isCanceled: "$isCanceled",
            isRejected: "$isRejected",
            lastMessage: "$lastMessage",
            rejectedAt: "$rejectedAt",
            status: "$status",
            updatedAt: "$updatedAt",
            userId: "$userId",
          },
          email: "$userInfo.email",
          name: "$userInfo.name",
          _id: "$userInfo._id",
          onlineStatus: "$onlineStatus"
        }
      }
    ]

    const paginationPipeline: any[] = [
      ...pipeline,
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]

    console.log(JSON.stringify(paginationPipeline));


    const [results, totalResults] = await Promise.all([
      this.contactModel.aggregate<any>(paginationPipeline).exec(),
      this.contactModel.aggregate(pipeline).exec(),
    ]);

    const totalPages = Math.ceil(totalResults.length / limit);

    return {
      results,
      page,
      limit,
      totalPages,
      totalResults: totalResults.length,
    };
  };
}
