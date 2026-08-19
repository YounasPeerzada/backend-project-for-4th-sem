import { User } from "../models/user.model.js";

const findUserById = (userId) => {
  return User.findById(userId);
};

const findUserByIdSanitized = (userId) => {
  return User.findById(userId).select("-password -refreshToken");
};

const findUserByUsernameOrEmail = ({ username, email }) => {
  return User.findOne({
    $or: [{ username }, { email }],
  });
};

const createUser = (userData) => {
  return User.create(userData);
};

const saveUser = (user) => {
  return user.save({ validateBeforeSave: false });
};

const clearUserRefreshToken = (userId) => {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
};

export {
  findUserById,
  findUserByIdSanitized,
  findUserByUsernameOrEmail,
  createUser,
  saveUser,
  clearUserRefreshToken,
};