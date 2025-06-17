import { db } from "../firebaseConfig";

async function getUserDetails(userId: string) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData == null) return null;
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

export default getUserDetails;
