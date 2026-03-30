import express from "express";
import multer from "multer";
import FormData from "form-data";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../config/database.js";
import { authenticate } from "../../middleware/jwt.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const ML_API = "http://127.0.0.1:8001";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post(
  "/",
  authenticate,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No Image provided" });
      }

      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: req.file.originalname || "photo.jpg",
        contentType: req.file.mimetype || "image/jpeg",
      });

      //sending image to Python's Fast API service
      const mlResponse = await axios.post(`${ML_API}/predict`, form, {
        headers: form.getHeaders(),
        timeout: 20000, //wait 20 seconds for processing before giving up
      });

      //extracting JSON returned
      const mlData = mlResponse.data;

      //if CLIP rejected the image, forward the error to Flutter
      if (mlData.error) {
        return res.status(400).json({ message: mlData.error });
      }

      const { condition, confidence } = mlData;
      //saving to the database
      const report = await prisma.dentalReport.create({
        data: {
          userId: req.user.id,
          condition,
          confidence,
        },
      });

      generateRecommendation(report.id, condition).catch(console.error);
      res.json({ success: true, condition, confidence, reportId: report.id });
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          success: false,
          message:
            "ML service is not running, start the python API on port 8001.",
        });
      }
      next(error);
    }
  },
);
//getting reports
router.get("/reports", authenticate, async (req, res, next) => {
  try {
    const reports = await prisma.dentalReport.findMany({
      //matching user id
      where: { userId: req.user.id },
      //showing latest first
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
});

//getting recommendations
router.get("/recommendations", authenticate, async (req, res, next) => {
  try {
    const reports = await prisma.dentalReport.findMany({
      where: {
        userId: req.user.id,
        recommendation: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
});

async function generateRecommendation(reportId, condition) {
  const prompt = `You are a friendly dental health assistant. A patient's dental photo was analyzed by an AI and diagnosed with: "${condition}".
Please provide:
1. A brief plain-English explanation of this condition (2 sentences max)
2. Three specific actionable steps the patient should take
3. Urgency level: should they see a dentist immediately, within a week, or at their next routine visit?
Keep the tone warm and supportive. Be concise. Do not use markdown.`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent(prompt);
  const recommendation = result.response.text();

  await prisma.dentalReport.update({
    where: { id: reportId },
    data: { recommendation },
  });
}

export default router;
