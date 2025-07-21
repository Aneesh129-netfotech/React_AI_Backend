import db from "./config/db.js";
import dotenv from 'dotenv'
import app from "./App.js";


dotenv.config();
const PORT = process.env.PORT || 8000;


db().then(() => {
  app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
}).catch((error) => {
  console.error("Database connection failed:", error);    
  process.exit(1);
});






