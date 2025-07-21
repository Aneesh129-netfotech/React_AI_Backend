import express from 'express';

import {
    registerRecruiter,
    LoginRecruiter,
    getRecruiterProfile,
    LogoutRecruiter      
} from '../Controllers/RecruiterController.js';
import protect from '../Middlewares/authMiddleware.js';

const recruiterRoutes = express.Router();

recruiterRoutes.post('/register', registerRecruiter);
recruiterRoutes.post('/login', LoginRecruiter);
recruiterRoutes.post('/logout', LogoutRecruiter);
recruiterRoutes.get('/profile', protect, getRecruiterProfile);

export default recruiterRoutes;
