import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    const parts = url.split("/");
    const uploadIndex = parts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) return null;

    const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
    return publicIdWithExt.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

const deleteFromCloudinary = async (url, resourceType = "image") => {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return null;

    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch {
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
