import express from 'express'
import cors from 'cors';
import session from 'express-session';
import mongoose from 'mongoose';
import recruiterRoutes from "./Routes/recruiterRoutes.js";
import JDrouter from "./Routes/JdRoutes.js"


const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Allow only your frontend URL
    credentials: true, // Allow cookies and authentication headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  })
);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Change to `true` if using HTTPS
  })
);

app.use(express.json());

app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jd', JDrouter);

export default app;