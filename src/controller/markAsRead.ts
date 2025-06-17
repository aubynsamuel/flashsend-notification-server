import { Request, Response } from "express";
import { db } from "../firebaseConfig";

const markAsRead = async (req: Request, res: Response) => {
  const { sendersUserId, roomId } = req.body;

  try {
    const messagesRef = db
      .collection("rooms")
      .doc(roomId)
      .collection("messages");

    const q = messagesRef
      .where("senderId", "!=", sendersUserId)
      .where("read", "==", false);

    const snapshot = await q.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No unread messages found",
      });
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    res.status(200).json({
      success: true,
      message: `Marked ${snapshot.size} messages as read`,
    });
  } catch (error) {
    console.error("Error in markAsRead endpoint:", error);
    res.status(500).json({ success: false, error: error });
  }
};

export default markAsRead;
