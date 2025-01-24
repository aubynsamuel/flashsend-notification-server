import express from "express";
import cors from "cors";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  doc,
  getDoc,
  setDoc,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import fetch from "node-fetch";

const getCurrentTime = () => {
  return Timestamp.now();
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const firebaseConfig = {
  apiKey: "AIzaSyDWpxeyrLdC_Wd2yIUHfyYRNLlyMt4e9fk",
  authDomain: "flash-send-11.firebaseapp.com",
  projectId: "flash-send-11",
  storageBucket: "flash-send-11.appspot.com",
  messagingSenderId: "407192831525",
  appId: "1:407192831525:android:6777825190b3aa59b6a1cc",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Helper function to fetch user details
async function getUserDetails(userId) {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        userId: userDoc.id,
        username: userData.username,
        deviceToken: userData.deviceToken,
        profileUrl: userData.profileUrl,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
}

async function sendNotification(
  recipientsToken,
  title,
  body,
  roomId,
  recipientsUserId,
  sendersUserId,
  profileUrl
) {
  const message = {
    to: recipientsToken,
    title,
    body: body.length < 100 ? body : body.substring(0, 100) + "...",
    data: {
      recipientsUserId,
      sendersUserId,
      roomId,
      profileUrl,
    },
    sound: "default",
    priority: "high",
    channelId: "fcm_fallback_notification_channel",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to send notification:", error);
    return null;
  }
}

app.post("/api/reply", async (req, res) => {
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

    const roomRef = doc(db, "rooms", roomId);
    const messagesRef = collection(roomRef, "messages");
    const newMessageRef = doc(messagesRef);

    const newMessage = {
      content: replyText,
      senderId: sendersUserId,
      senderName: sender.username,
      createdAt: getCurrentTime(),
      delivered: true,
      read: false,
    };

    await setDoc(newMessageRef, newMessage);
    await setDoc(
      roomRef,
      {
        lastMessage: newMessage.content,
        lastMessageTimestamp: getCurrentTime(),
        lastMessageSenderId: sendersUserId,
      },
      { merge: true }
    );

    if (recipient.deviceToken) {
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

    res.status(200).json({ success: true, message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error in reply endpoint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/markAsRead", async (req, res) => {
  const { sendersUserId, roomId } = req.body;

  try {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(
      messagesRef,
      where("senderId", "!=", sendersUserId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No unread messages found",
      });
    }

    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    res.status(200).json({
      success: true,
      message: `Marked ${snapshot.size} messages as read`,
    });
  } catch (error) {
    console.error("Error in markAsRead endpoint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
