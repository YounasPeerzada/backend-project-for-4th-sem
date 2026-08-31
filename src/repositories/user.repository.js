import { User } from "../models/user.model.js";

const findUserById = async (userId) => {
  return await User.findById(userId);
};

const findUserByIdSanitized = async (userId) => {
  return await User.findById(userId).select("-password -refreshToken");
};

const findUserByUsernameOrEmail = async ({ username, email }) => {
  return await User.findOne({
    $or: [{ username }, { email }],
  });
};

const createUser = async (userData) => {
  return await User.create(userData);
};

const updateUserRefreshToken = async (userId, refreshToken) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken },
    },
    {
      new: true,
    }
  );
};

const clearUserRefreshToken = async (userId) => {
  return await User.findByIdAndUpdate(
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
  updateUserRefreshToken,
  clearUserRefreshToken,
};