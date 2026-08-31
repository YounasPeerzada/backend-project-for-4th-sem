import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import {
  findUserById,
  findUserByIdSanitized,
  findUserByUsernameOrEmail,
  createUser,
  updateUserRefreshToken,
  clearUserRefreshToken,
} from "../repositories/user.repository.js";
import {
  hashPassword,
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
} from "../utils/auth.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    await updateUserRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const registerUser = async ({
  username,
  fullName,
  email,
  password,
  avatarPathLocalPath,
  coverImageLocalPath,
}) => {
  const existingUser = await findUserByUsernameOrEmail({ username, email });

  if (existingUser) {
    throw new ApiError(409, "Username or email already in use");
  }

  if (!avatarPathLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarPathLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    username: username.toLowerCase(),
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }

  const createdUser = await findUserByIdSanitized(user._id);

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return createdUser;
};

const loginUser = async ({ username, email, password }) => {
  const user = await findUserByUsernameOrEmail({ username, email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await isPasswordCorrect(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedUser = await findUserByIdSanitized(user._id);

  return { loggedUser, accessToken, refreshToken };
};

const logoutUser = async (userId) => {
  await clearUserRefreshToken(userId);
};

const refreshAccessToken = async (incomingRefreshToken) => {
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await findUserById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("REFRESH ERROR:", error);
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

const verifyAccessToken = async (token) => {
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await findUserByIdSanitized(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }
  return user;
};

export { registerUser, loginUser, logoutUser, refreshAccessToken, verifyAccessToken };