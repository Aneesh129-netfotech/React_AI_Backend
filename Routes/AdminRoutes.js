import express from "express";
import { deleteApplicant, deleteRecruiter, getAllApplicants, getAllJD, getAllRecruiters, getJobById, loginAdmin, registerAdmin } from "../Controllers/AdminController.js";



const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/getAllRecruiters", getAllRecruiters);
router.get("/getAllApplicants", getAllApplicants);
router.delete("/deleteRecruiter/:id", deleteRecruiter);
router.delete("/deleteApplicant/:id", deleteApplicant);
router.get("/getAllJD", getAllJD);
router.get("/getJob/:id", getJobById);

export default router;