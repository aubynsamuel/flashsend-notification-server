import express from "express";
import cors from "cors";
import router from "./router/api";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.get("/health", (_, res) => {
  res.status(200).json({ status: "healthy" });
  console.log("A device connected");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
