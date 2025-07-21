import express from 'express';
import multer from 'multer';
import cors from 'cors';
import {generateJD,filterJD} from "../Controllers/JdController.js";
import protect from '../Middlewares/authMiddleware.js';
const JDrouter = express.Router();
const upload=multer({dest: 'uploads/'});
JDrouter.post('/generate',protect, generateJD);
JDrouter.post('/filter',upload.array('resumes',20), protect, filterJD);

export default JDrouter;    