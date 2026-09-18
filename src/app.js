import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);

import fs from "fs";

app.use((err, req, res, next) => {
  if (req.file?.path && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {}
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file?.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {}
        }
      }
    } else {
      for (const key of Object.keys(req.files)) {
        for (const file of req.files[key]) {
          if (file?.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          }
        }
      }
    }
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    statusCode,
    data: null,
    message: err.message || "Something went wrong",
    success: false,
    errors: err.errors || [],
  });
});

export { app };

