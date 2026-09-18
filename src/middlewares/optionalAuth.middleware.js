import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../services/user.service.js";

export const optionalJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next();
    }

    const user = await verifyAccessToken(token);
    req.user = user;
    next();
  } catch {
    next();
  }
});
