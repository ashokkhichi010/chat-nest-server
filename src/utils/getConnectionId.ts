import { Types } from "mongoose";

export const getConnectionId = (userId: string | Types.ObjectId, contactUser: string | Types.ObjectId) => [userId, contactUser].sort().join('_');