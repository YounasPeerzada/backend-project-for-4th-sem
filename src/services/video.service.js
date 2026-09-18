import { ApiError } from "../utils/ApiError.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import {
  createVideo,
  findVideoById,
  findVideoByIdWithOwner,
  updateVideoById,
  deleteVideoById,
  getAllVideos,
} from "../repositories/video.repository.js";

const publishVideo = async ({
  title,
  description,
  videoLocalPath,
  thumbnailLocalPath,
  ownerId,
}) => {
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.url) {
    throw new ApiError(500, "Failed to upload video");
  }

  if (!thumbnail?.url) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  const video = await createVideo({
    title: title.trim(),
    description: description.trim(),
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration || 0,
    owner: ownerId,
  });

  if (!video) {
    throw new ApiError(500, "Failed to publish video");
  }

  return video;
};

const getVideos = async (filters) => {
  return await getAllVideos(filters);
};

const getVideoById = async (videoId, requesterId = null) => {
  const video = await findVideoByIdWithOwner(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const isOwner =
    requesterId && video.owner?._id?.toString() === requesterId.toString();

  if (!video.isPublished && !isOwner) {
    throw new ApiError(404, "Video not found");
  }

  return video;
};

const updateVideo = async ({
  videoId,
  title,
  description,
  thumbnailLocalPath,
  ownerId,
}) => {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== ownerId.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const updateData = {};

  if (title?.trim()) updateData.title = title.trim();
  if (description?.trim()) updateData.description = description.trim();

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail?.url) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }

    await deleteFromCloudinary(video.thumbnail, "image");
    updateData.thumbnail = thumbnail.url;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const updatedVideo = await updateVideoById(videoId, updateData);

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video");
  }

  return updatedVideo;
};

const deleteVideo = async (videoId, ownerId) => {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== ownerId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  await deleteFromCloudinary(video.videoFile, "video");
  await deleteFromCloudinary(video.thumbnail, "image");

  const deletedVideo = await deleteVideoById(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Failed to delete video");
  }

  return deletedVideo;
};

const togglePublishStatus = async (videoId, ownerId) => {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== ownerId.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const updatedVideo = await updateVideoById(videoId, {
    isPublished: !video.isPublished,
  });

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to toggle publish status");
  }

  return updatedVideo;
};

export {
  publishVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
