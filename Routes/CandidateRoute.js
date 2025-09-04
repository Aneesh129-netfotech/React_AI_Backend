import express from 'express'
import upload from '../Middlewares/upload.js';
import { loginCandidate, registerCandidate, applyToSpecificJD } from '../Controllers/CandidateController.js';
import protect from '../Middlewares/authMiddleware.js';
import { authorize } from '../Middlewares/authorize.js';


const router = express.Router();

router.post("/register-candidate", registerCandidate)
router.post("/login-candidate", loginCandidate)
router.post('/jobs/:jobId/apply', protect, authorize('candidate'), upload.single('resume'), applyToSpecificJD);
export default router;