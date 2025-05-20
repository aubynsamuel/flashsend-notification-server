# FlashSend Server

A lightweight Node.js server for FlashSend that handles chat notifications using cloud messaging Firebase

---

## 🚀 Features

* **Send Push Notifications**: Utilize **Firebase Cloud Messaging (FCM)** or **Expo Notifications Service (ENS)**.
* **Store and Sync Messages**: Persist and synchronize chat messages in **Firestore**.
* **Bulk Read Marking**: Efficiently mark all unread messages in a room as read.
* **Update Room Metadata**: Automatically update room details like the **last message**, **timestamp**, and **sender**.
* **Health Check Endpoint**: A simple endpoint to verify server status.

---

## 🛠️ Setup

1.  **Clone the Repository**

    ```bash
    git clone [https://github.com/yourusername/flashsend-server.git](https://github.com/yourusername/flashsend-server.git)
    cd flashsend-server
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Add Firebase Credentials**

    * **Admin SDK**: Place your service account JSON file as `serviceAccountKey.json` in the project's root directory.
    * **Client SDK**: Create a file named `src/firebaseConfig.ts` and export your Firebase configuration:

        ```typescript
        export const firebaseConfig = {
          apiKey: "<YOUR_API_KEY>",
          authDomain: "<YOUR_AUTH_DOMAIN>",
          projectId: "<YOUR_PROJECT_ID>",
          // …other config fields
        }
        ```

4.  **Environment**

    Ensure the **PORT** environment variable is set if you don't want to use the default port `3000`.

5.  **Run the Server**

    ```bash
    npm run dev
    ```

    or

    ```bash
    npm start
    ```

---

## 📡 API Endpoints

| Method | Path | Description |
| :----- | :--- | :---------- |
| `POST` | `/api/sendNotification` | Send a push notification to a single device |
| `POST` | `/api/reply` | Save a chat reply, update the room, and notify the user |
| `POST` | `/api/markAsRead` | Mark all unread messages in a room as read |
| `GET` | `/health` | Simple health check (returns `{ status: "healthy" }`) |

### Example: Send Notification

```bash
curl -X POST http://localhost:3000/api/sendNotification \
  -H "Content-Type: application/json" \
  -d '{
    "recipientsToken":"<DEVICE_TOKEN>",
    "title":"Hello!",
    "body":"You have a new message",
    "roomId":"room123",
    "recipientsUserId":"userA",
    "sendersUserId":"userB",
    "profileUrl":"[https://example.com/avatar.jpg](https://example.com/avatar.jpg)"
  }'
  
