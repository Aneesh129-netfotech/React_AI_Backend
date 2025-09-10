import express from 'express'
import upload from '../Middlewares/upload.js';
import { loginCandidate, registerCandidate, applyToSpecificJD,addCandidateDetails,getCandidateProfile,getAllCandidatesdataAccordingToJD,getAllAppliedJobs,updateCandidateAdditionalDetails,updateCandidateBasicDetails,getCandidateAdditionalDetails } from '../Controllers/CandidateController.js';
import protect from '../Middlewares/authMiddleware.js';
import { authorize } from '../Middlewares/authorize.js';


const router = express.Router();

router.post("/register-candidate", registerCandidate)
router.post("/login-candidate", loginCandidate)
router.post('/jobs/:jobId/apply', protect, authorize('candidate'), upload.single('resume'), applyToSpecificJD);
router.post('/add-additionalDetails',protect,addCandidateDetails);
router.get('/getcandidate-profile',protect,authorize('candidate'),getCandidateProfile)
router.get('/get-all-candidates/:jobId', getAllCandidatesdataAccordingToJD);
router.get('/get-all-applied-jobs',protect,authorize('candidate'),getAllAppliedJobs);
router.put('/update-candidate-additional-details/:candidateId',updateCandidateAdditionalDetails)
router.put('/update-candidate-basic-details/:candidateId',updateCandidateBasicDetails)
router.get('/get-candidate-additional-details/:candidateId',getCandidateAdditionalDetails)
export default router;