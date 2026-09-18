import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const createVideo = async (videoData) => {
  return await Video.create(videoData);
};

const findVideoById = async (videoId) => {
  if (!mongoose.isValidObjectId(videoId)) return null;
  return await Video.findById(videoId);
};

const findVideoByIdWithOwner = async (videoId) => {
  if (!mongoose.isValidObjectId(videoId)) return null;

  const videos = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);

  return videos[0] || null;
};

const updateVideoById = async (videoId, updateData) => {
  if (!mongoose.isValidObjectId(videoId)) return null;
  return await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true }
  );
};

const deleteVideoById = async (videoId) => {
  if (!mongoose.isValidObjectId(videoId)) return null;
  return await Video.findByIdAndDelete(videoId);
};

const getAllVideos = async ({
  page = 1,
  limit = 10,
  query = "",
  sortBy = "createdAt",
  sortType = "desc",
  userId,
}) => {
  const matchStage = {
    isPublished: true,
  };

  if (query?.trim()) {
    matchStage.$or = [
      { title: { $regex: query.trim(), $options: "i" } },
      { description: { $regex: query.trim(), $options: "i" } },
    ];
  }

  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId format");
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortDirection = sortType === "asc" ? 1 : -1;
  const allowedSortFields = ["createdAt", "title", "duration", "updatedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: {
        [sortField]: sortDirection,
      },
    },
  ];

  return await Video.aggregatePaginate(Video.aggregate(pipeline), {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });
};

export {
  createVideo,
  findVideoById,
  findVideoByIdWithOwner,
  updateVideoById,
  deleteVideoById,
  getAllVideos,
};
