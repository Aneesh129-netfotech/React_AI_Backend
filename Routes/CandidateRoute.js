import express from 'express'
import upload from '../Middlewares/upload.js';
import { loginCandidate, registerCandidate, applyToSpecificJD,addCandidateDetails,getCandidateProfile,getAllCandidatesdataAccordingToJD,getAllAppliedJobs } from '../Controllers/CandidateController.js';
import protect from '../Middlewares/authMiddleware.js';
import { authorize } from '../Middlewares/authorize.js';


const router = express.Router();

router.post("/register-candidate", registerCandidate)
router.post("/login-candidate", loginCandidate)
router.post('/jobs/:jobId/apply', protect, authorize('candidate'), upload.single('resume'), applyToSpecificJD);
router.post('/add-additionalDetails',addCandidateDetails);
router.get('/getcandidate-profile/:candidateId',getCandidateProfile)
router.get('/get-all-candidates/:jobId', getAllCandidatesdataAccordingToJD);
router.get('/get-all-applied-jobs',protect,authorize('candidate'),getAllAppliedJobs);
export default router;