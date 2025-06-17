export interface MessageInterface {
  token: string;
  data: {
    title: string;
    body: string;
    recipientsUserId: string;
    sendersUserId: string;
    roomId: string;
    profileUrl: string;
  };
  android: {
    priority: "high" | "normal" | undefined;
  };
}
