import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const isPasswordCorrect = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      _id: userId,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export {
  hashPassword,
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
};
