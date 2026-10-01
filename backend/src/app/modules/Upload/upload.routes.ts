import express from "express";
import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import ApiError from "../../utils/apiError";
import { upload, uploadToCloudinary } from "../../utils/cloudinary.util";
import { protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = express.Router();

// Protected route — admin only
router.use(protectRoute);
router.use(restrictTo("admin", "superadmin", "editor"));

router.post(
  "/",
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError("No image file provided", 400);
    }

    const url = await uploadToCloudinary(req.file.buffer, "uploads");

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { url },
    });
  }),
);

export default router;
