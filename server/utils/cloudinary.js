import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
---------------------------------------------------
Existing export (DO NOT REMOVE)
---------------------------------------------------
*/
export default cloudinary;

/*
---------------------------------------------------
NEW: Upload PDF buffer (for consultation reports)
---------------------------------------------------
*/
export async function uploadPDFBuffer(buffer, filename) {
  try {
    const base64 = buffer.toString("base64");

    const dataUri = `data:application/pdf;base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: "raw",
      public_id: `reports/${filename}`,
      overwrite: true,
    });

    return result.secure_url;

  } catch (error) {
    console.error("Cloudinary PDF upload error:", error);
    throw error;
  }
}