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
import admin from "firebase-admin";

import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Your existing Firebase client initialization (for Firestore, etc.)
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

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const getCurrentTime = () => {
  return Timestamp.now();
};

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

async function sendNotificationWithENS(
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

/**
 * Send a notification using Firebase Cloud Messaging (FCM) via the Admin SDK.
 *
 * @param {string} recipientsToken - The device token of the recipient.
 * @param {string} title - The notification title.
 * @param {string} body - The notification body.
 * @param {string} roomId - The room identifier.
 * @param {string} recipientsUserId - The recipient’s user ID.
 * @param {string} sendersUserId - The sender’s user ID.
 * @param {string} profileUrl - The sender’s profile URL.
 * @returns {Promise<string|null>} The FCM message ID or null if sending failed.
 */
async function sendNotification(
  recipientsToken,
  title,
  body,
  roomId,
  recipientsUserId,
  sendersUserId,
  profileUrl
) {
  // Build the FCM message
  const message = {
    token: recipientsToken,
    // notification: {
    //   title,
    //   body: body,
    // },
    data: {
      title,
      body: body,
      recipientsUserId: recipientsUserId,
      sendersUserId: sendersUserId,
      roomId: roomId,
      profileUrl: profileUrl,
    },
    android: {
      priority: "high",
      // notification: {
      //   sound: "default",
      //   channelId: "flash",
      // },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return null;
  }
}

app.post("/api/sendNotification", async (req, res) => {
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
    await sendNotification(
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
    res.status(500).json({ success: false, error: error.message });
  }
});

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
