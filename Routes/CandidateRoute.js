import express from 'express'
import { loginCandidate, registerCandidate } from '../Controllers/CandidateController.js';


const router = express.Router();

router.post("/register-candidate", registerCandidate)
router.post("/login-candidate", loginCandidate)

export default router;