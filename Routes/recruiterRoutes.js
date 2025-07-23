import express from 'express';

import {
    registerRecruiter,
    LoginRecruiter,
    getRecruiterProfile,
    LogoutRecruiter,      
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
    getRecruiterData,
    updateRecruiter
} from '../Controllers/RecruiterController.js';
import protect from '../Middlewares/authMiddleware.js';

const recruiterRoutes = express.Router();

recruiterRoutes.post('/register', registerRecruiter);
recruiterRoutes.post('/login', LoginRecruiter);
recruiterRoutes.post('/logout', LogoutRecruiter);
recruiterRoutes.get('/profile', protect, getRecruiterProfile);
recruiterRoutes.post("/forgot-password", forgotPassword);
recruiterRoutes.post("/verify-otp", verifyForgotPasswordOTP);
recruiterRoutes.post("/reset-password", resetPassword);

recruiterRoutes.get("/getRecruiterData", protect, getRecruiterData)
recruiterRoutes.put("/update" , protect, updateRecruiter)

export default recruiterRoutes;
