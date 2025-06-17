async function sendNotificationWithENS(
  recipientsToken: string,
  title: string,
  body: string,
  roomId: string,
  recipientsUserId: string,
  sendersUserId: string,
  profileUrl: string
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

export default sendNotificationWithENS;
