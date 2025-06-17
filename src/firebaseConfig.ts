import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as string | ServiceAccount),
});

const db = admin.firestore();

export { db, admin };
