import multer from "multer";

// multer = form-data se file nikalta hai. memoryStorage = file RAM me rakho, disk pe nahi
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG or PDF allowed"));
    }
    cb(null, true);
  },
});

// file ke andar ke pehle bytes dekhte hain. Koi .exe ko .jpg naam dekar bhej de to pakad lenge
const looksValid = (buf, mime) => {
  if (!buf || buf.length < 4) return false;
  if (mime === "application/pdf") return buf.subarray(0, 4).toString() === "%PDF";
  if (mime === "image/png") return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  return false;
};

// Routes me ye use hoga: form-data me file ka field naam "file" hona chahiye
export const uploadFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Max 5 MB" });
      }
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "File is required (form-data field name: file)" });
    }
    if (!looksValid(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ message: "File content does not match its type" });
    }
    next();
  });
};