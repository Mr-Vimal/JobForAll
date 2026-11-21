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

connectDB();
await connectCloudinary();

// Clerk middleware FIRST
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
  })
);

// CORS
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5000',
  'https://jobforall-lk.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// Webhook must receive raw body
app.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

app.use(express.json());

// Test authentication
app.get("/api/auth-check", (req, res) => {
  const auth = getAuth(req);

  console.log("AUTH:", auth);

  res.json({
    success: true,
    isAuthenticated: auth.isAuthenticated,
    userId: auth.userId
  });
});

// Public routes
app.get("/", (req, res) => {
  res.send("API Working");
});

// Other routes
app.use("/api/jobs", jobRoutes);
app.use("/api/company", companyRoutes);

// Protected user routes
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});