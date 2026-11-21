
import { getAuth } from "@clerk/express";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

// Register User
export const createUser = async (req, res) => {
    try {
        const { userId } = getAuth(req);

        console.log("Clerk User ID:", userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Clerk authentication failed"
            });
        }

        const { name, email, image } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        let user = await User.findOne({ clerkId: userId });

        if (user) {
            return res.status(200).json({
                success: true,
                user,
                message: "User already registered"
            });
        }

        user = await User.create({
            _id: userId,
            clerkId: userId,
            name,
            email,
            image: image || "",
            resume: ""
        });

        return res.status(201).json({
            success: true,
            user,
            message: "User registered successfully"
        });

    } catch (error) {
        console.error("Create User Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get User Data
export const getUserData = async (req, res) => {
    try {
        const { userId } = getAuth(req);

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Apply For Job
export const applyForJob = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { jobId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required"
            });
        }

        const jobData = await Job.findById(jobId);

        if (!jobData) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const alreadyApplied = await JobApplication.findOne({
            jobId,
            userId: user._id
        });

        if (alreadyApplied) {
            return res.json({
                success: false,
                message: "Already applied"
            });
        }

        await JobApplication.create({
            companyId: jobData.companyId,
            userId: user._id,
            jobId,
            date: Date.now()
        });

        return res.json({
            success: true,
            message: "Applied successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get User Applications
export const getUserJobApplications = async (req, res) => {
    try {
        const { userId } = getAuth(req);

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const applications = await JobApplication.find({
            userId: user._id
        })
            .populate("companyId", "name email image")
            .populate(
                "jobId",
                "title description location category level salary"
            );

        return res.json({
            success: true,
            applications
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Update User Resume
export const updateUserResume = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const resumeFile = req.file;

        if (!resumeFile) {
            return res.status(400).json({
                success: false,
                message: "Please upload a resume"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const resumeUpload = await cloudinary.uploader.upload(
            resumeFile.path,
            {
                resource_type: "raw"
            }
        );

        user.resume = resumeUpload.secure_url;

        await user.save();

        return res.json({
            success: true,
            message: "Resume updated successfully",
            user
        });

    } catch (error) {
        console.error("Resume Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
