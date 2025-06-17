import { db, admin } from "../firebaseConfig";
import getUserDetails from "../utils/getUserDetails";
import sendNotification from "../utils/sendNotificationWithFCM";
import sendNotificationWithENS from "../utils/sendNotificationWithENS";
import { Request, Response } from "express";

const reply = async (req: Request, res: Response) => {
  const { sendersUserId, recipientsUserId, roomId, replyText } = req.body;

  try {
    // Fetch both users' details
    const [sender, recipient] = await Promise.all([
      getUserDetails(sendersUserId),
      getUserDetails(recipientsUserId),
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({
        success: false,
        error: "One or both users not found",
      });
    }

    const roomRef = db.collection("rooms").doc(roomId);
    const messagesRef = roomRef.collection("messages");

    const newMessage = {
      content: replyText,
      senderId: sendersUserId,
      senderName: sender.username,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      delivered: true,
      read: false,
    };

    await messagesRef.add(newMessage);
    await roomRef.set(
      {
        lastMessage: newMessage.content,
        lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSenderId: sendersUserId,
      },
      { merge: true }
    );

    if (recipient.deviceToken) {
      if (recipient.deviceToken?.includes("ExponentPushToken")) {
        await sendNotificationWithENS(
          recipient.deviceToken,
          sender.username,
          replyText,
          roomId,
          recipientsUserId,
          sendersUserId,
          sender.profileUrl
        );
      } else {
        await sendNotification(
          recipient.deviceToken,
          sender.username,
          replyText,
          roomId,
          recipientsUserId,
          sendersUserId,
          sender.profileUrl
        );
      }
    }

    res.status(200).json({ success: true, message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error in reply endpoint:", error);
    res.status(500).json({ success: false, error: error });
  }
};

export default reply;
