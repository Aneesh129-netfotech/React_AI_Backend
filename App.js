import express from 'express'
import cors from 'cors';
import recruiterRoutes from "./Routes/recruiterRoutes.js";
import JDrouter from "./Routes/JdRoutes.js"


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jd', JDrouter);

export default app;