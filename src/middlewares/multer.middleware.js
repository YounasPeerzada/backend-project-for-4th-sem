import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "videoFile") {
    if (file.mimetype && file.mimetype.startsWith("video/")) {
      return cb(null, true);
    }
    return cb(
      new ApiError(400, "Invalid video file type. Only video files are allowed.")
    );
  }

  if (
    file.fieldname === "thumbnail" ||
    file.fieldname === "avatar" ||
    file.fieldname === "coverImage"
  ) {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(
      new ApiError(
        400,
        `Invalid ${file.fieldname} file type. Only image files are allowed.`
      )
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
});

