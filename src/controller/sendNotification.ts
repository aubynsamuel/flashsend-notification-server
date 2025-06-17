import { Request, Response } from "express";
import sendNotificationWithFCM from "../utils/sendNotificationWithFCM";

const sendNotification = async (req: Request, res: Response) => {
  const {
    recipientsToken,
    title,
    body,
    roomId,
    recipientsUserId,
    sendersUserId,
    profileUrl,
  } = req.body;
  try {
    await sendNotificationWithFCM(
      recipientsToken,
      title,
      body,
      roomId,
      recipientsUserId,
      sendersUserId,
      profileUrl
    );
    res
      .status(200)
      .json({ success: true, message: "Notification sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
};

export default sendNotification;
