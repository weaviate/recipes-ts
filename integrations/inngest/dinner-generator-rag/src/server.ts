import "dotenv/config";

import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { generateMeal } from "./inngest/functions";

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Set up Inngest endpoint with all functions
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [generateMeal],
  })
);

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
