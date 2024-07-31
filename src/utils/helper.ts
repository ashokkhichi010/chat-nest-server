import { Types } from "mongoose";

const generateRandomNumber = (length: number): number => {
    const randomNumber = Math.random().toString(10).slice(2, 2 + length);
    return parseInt(randomNumber);
}

const compairMongoId = (id_1: Types.ObjectId | string, id_2: Types.ObjectId | string) => {
    return id_1.toString() === id_2.toString();
}


export {
    generateRandomNumber,
    compairMongoId,
}