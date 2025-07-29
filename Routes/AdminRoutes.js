import express from "express";
import { getAllRecruiters, loginAdmin, registerAdmin } from "../Controllers/AdminController.js";



const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/getAllRecruiters", getAllRecruiters)

export default router;