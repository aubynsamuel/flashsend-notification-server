import { admin } from "../firebaseConfig";
import { MessageInterface } from "../types";

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
  recipientsToken: string,
  title: string,
  body: string,
  roomId: string,
  recipientsUserId: string,
  sendersUserId: string,
  profileUrl: string
): Promise<string | null> {
  const message: MessageInterface = {
    token: recipientsToken,
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

export default sendNotification;
