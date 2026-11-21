
import "dotenv/config";
import express from "express";
import cors from "cors";

import {
  clerkMiddleware,
  getAuth
} from "@clerk/express";

import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";

import userRoutes from "./routes/userRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import { clerkWebhooks } from "./controllers/webhooks.js";

const app = express();

// 1. CORS FIRST
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://jobforall-lk.vercel.app",
  "https://client-three-ashen-56.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked CORS origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 2. WEBHOOK RAW BODY
app.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

// 3. JSON BODY
app.use(express.json());

// 4. INITIALIZE DATABASE AND CLOUDINARY
let initializationPromise;

app.use(async (req, res, next) => {
  try {
    if (!initializationPromise) {
      initializationPromise = Promise.all([
        connectDB(),
        connectCloudinary()
      ]);
    }

    await initializationPromise;
    next();
  } catch (error) {
    console.error("Initialization Error:", error);
    next(error);
  }
});

// 5. CLERK MIDDLEWARE
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
  })
);

// 6. TEST ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JobForAll API Working"
  });
});

// 7. AUTH CHECK
app.get("/api/auth-check", (req, res) => {
  const auth = getAuth(req);

  res.json({
    success: true,
    isAuthenticated: auth.isAuthenticated,
    userId: auth.userId
  });
});

// 8. PUBLIC ROUTES
app.use("/api/jobs", jobRoutes);
app.use("/api/company", companyRoutes);

// 9. PROTECTED USER ROUTES
app.use("/api/users", (req, res, next) => {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      success: false,
      message: "Clerk authentication failed"
    });
  }

  next();
}, userRoutes);

// 10. ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Backend Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// IMPORTANT: Export app for Vercel
export default app;
