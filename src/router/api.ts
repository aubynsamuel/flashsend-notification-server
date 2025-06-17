import { Router } from "express";
import markAsRead from "../controller/markAsRead";
import reply from "../controller/reply";
import sendNotification from "../controller/sendNotification";

const router = Router();

router.post("/markAsRead", markAsRead);

router.post("/reply", reply);

router.post("/sendNotification", sendNotification);

export default router;
