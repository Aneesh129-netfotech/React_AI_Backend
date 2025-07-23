import express from "express"
import { saveMessage } from "../Controllers/MessageController.js";

const messageRouter = express.Router();

messageRouter.post("/message", saveMessage);

export default messageRouter;