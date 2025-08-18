import express from "express";
import multer from "multer";
import cors from "cors";
import {
  generateJD,
  filterJD,
  getResumesByJdId,
  deleteJd,
  generateQuestionsFromJD,
  uploadJDPfd,
  getallJDs,
  getJDById,
  getAllFilteredResumes,getFilteredResumesByJD,
  getAllJdByRecruiter

} from "../Controllers/JdController.js";
import protect from "../Middlewares/authMiddleware.js";
import JD from "../Models/JdSchema.js";
const JDrouter = express.Router();
const upload = multer({ dest: "uploads/" });

JDrouter.post("/generate", protect, generateJD);
JDrouter.post("/filter", upload.array("resumes", 20), protect, filterJD);
JDrouter.get("/resumes/:jdId", protect, getResumesByJdId);
JDrouter.post("/generate-questions", protect, generateQuestionsFromJD);
JDrouter.delete("/delete/:id", protect, deleteJd);
JDrouter.post("/upload-pdf", protect, upload.single("jdPdf"), uploadJDPfd);
JDrouter.get("/get-all", protect, getallJDs);
JDrouter.get("/get-jd-summary/:id", getJDById);
JDrouter.get("/get-all-filter-resumes/:jdId", protect, getAllFilteredResumes);
JDrouter.get("/filtered-resumes/:jdId", protect, getAllFilteredResumes);
JDrouter.get("/get-all-jd-by-recruiter", protect, getAllJdByRecruiter);

export default JDrouter;
