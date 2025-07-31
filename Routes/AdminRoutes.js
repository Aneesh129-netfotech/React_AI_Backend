import express from "express";
import { getAllJD, getAllRecruiters, getJobById, loginAdmin, registerAdmin } from "../Controllers/AdminController.js";



const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/getAllRecruiters", getAllRecruiters);
router.get("/getAllJD", getAllJD);
router.get("/getJob/:id", getJobById);

export default router;