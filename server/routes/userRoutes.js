
import express from "express";

import {
    createUser,
    getUserData,
    applyForJob,
    getUserJobApplications,
    updateUserResume
} from "../controllers/userController.js";

import upload from "../config/multer.js";

const router = express.Router();

router.post("/register", createUser);

router.get("/user", getUserData);

router.post("/apply", applyForJob);

router.get("/applications", getUserJobApplications);

router.post(
    "/update-resume",
    upload.single("resume"),
    updateUserResume
);

export default router;
