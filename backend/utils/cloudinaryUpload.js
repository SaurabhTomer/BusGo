import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";

// ---------- File Cloudinary pe bhejna ----------
// buffer = file ka data (memory me aaya hai, disk pe nahi)
// folder = Cloudinary me kaunse folder me rakhna hai
export const uploadBuffer = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: crypto.randomUUID(), // random naam, koi guess na kar sake
        type: "authenticated", // PRIVATE: bina signed link ke file khulegi hi nahi
        resource_type: "auto", // image ho ya pdf, khud samajh lo
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer); // buffer stream me daal ke upload shuru
  });
};

// ---------- File Cloudinary se hatana (purani file replace hone par) ----------
export const deleteFile = async (publicId, resourceType) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: "authenticated",
    });
  } catch (error) {
    // delete fail hua to bhi kaam nahi rukna chahiye, bas log
    console.error("Cloudinary delete failed:", error?.message || error);
  }
};

// ---------- Admin ko dikhane ke liye temporary link (10 minute) ----------
// private file ka link: expire hone ke baad kaam nahi karta
export const getTempUrl = (doc) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60; // abhi + 10 min (seconds me)
  return cloudinary.utils.private_download_url(doc.publicId, doc.format, {
    resource_type: doc.resourceType,
    type: "authenticated",
    expires_at: expiresAt,
  });
};