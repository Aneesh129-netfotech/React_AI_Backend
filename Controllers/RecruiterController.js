import Recruiter from "../Models/Recruiter.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTP } from "../utils/sendEmail.js";


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
};

export const registerRecruiter = async (req, res) => {
    const { name, email, password, companyName, companyWebsite, number, designation, industry, linkedInProfile } = req.body;

    if (!name || !email || !password || !companyName || !number || !designation)
        return res.status(401).json({ message: "Missing Required Fields" })

    try {
        const recruterExists = await Recruiter.findOne({ email });
        if (recruterExists) {
            return res.status(400).json({ message: "Recruiter already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 6);
        const recruiter = await Recruiter.create({
            name,
            email,
            password: hashedPassword,
            companyName,
            companyWebsite,
            number,
            designation,
            industry,
            linkedInProfile

        });

        res.status(201).json({
            _id: recruiter._id,
            name: recruiter.name,
            email: recruiter.email,
            companyName: recruiter.companyName,
            companyWebsite: recruiter.companyWebsite,
            number: recruiter.number,
            designation: recruiter.designation,
            industry: recruiter.industry,
            linkedInProfile: recruiter.linkedInProfile,
        });
    }
    catch (error) {
        console.error("Error registering recruiter:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const LoginRecruiter = async (req, res) => {
    const { email, password } = req.body;
    try {
        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            return res.status(400).json({ message: "Recruiter not found" });
        }

        const isMatch = await bcrypt.compare(password, recruiter.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.status(200).json({
            _id: recruiter._id,
            name: recruiter.name,
            email: recruiter.email,
            companyName: recruiter.companyName,
            companyWebsite: recruiter.companyWebsite,
            number: recruiter.number,
            designation: recruiter.designation,
            industry: recruiter.industry,
            linkedInProfile: recruiter.linkedInProfile,
            token: generateToken(recruiter._id)
        });
    }
    catch (error) {
        console.error("Error logging in recruiter:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getRecruiterProfile = async (req, res) => {
    const recruiter = await Recruiter.findById(req.user.id).select("-password");
    res.json(recruiter);
};

export const LogoutRecruiter = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0), // Expire the cookie immediately
        secure: true,
        sameSite: "Strict"
    });
    req.user = null;
    res.json({ message: "Recruiter Logged out successfully" });
};

export const forgotPassword = async (req, res) => {

    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    const { email } = req.body;

    if (!email)
        return res.status(400).json({ message: "Email is required" })

    const recruiter = await Recruiter.findOne({ email });

    if (!recruiter)
        return res.status(400).json({ message: "Recruiter not found" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    recruiter.otp = otp;
    recruiter.otpExpires = otpExpires;
    await recruiter.save();

    await sendOTP(email, otp);

    res.status(200).json({ message: "Password reset OTP sent to email. Please verify." })

};

export const verifyForgotPasswordOTP = async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
    }

    const recruiter = await Recruiter.findOne({
        otp: otp,
        otpExpires: { $gt: Date.now() },
    });

    if (!recruiter) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    recruiter.otp = undefined;
    recruiter.otpExpires = undefined;
    await recruiter.save();

    res.json({ message: "OTP verified successfully. You can now reset your password." });

}

export const resetPassword = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    const recruiter = await Recruiter.findOne({ email });

    if (!recruiter) {
        return res.status(400).json({ message: "Recruiter not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 6);
    recruiter.password = hashedPassword;


    await recruiter.save();

    res.json({ message: "Password reset successful. You can now log in with your new password." });
};

export const getRecruiterData = async (req, res) => {
    try {
        const recruiter = await Recruiter.findById(req.user.id).select("-password");

        if (!recruiter)
            return res.status(404).json({ message: "Recruiter Not found " });

        res.status(200).json(recruiter)

    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }

}

export const updateRecruiter = async (req, res) => {
    const { name, email, companyName, companyWebsite, number, designation, industry, linkedInProfile } = req.body;
    try {
        const recruiter = await Recruiter.findById(req.user.id);

        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found" });
        }

        if (name) recruiter.name = name;
        if (email) recruiter.email = email;
        if (companyName) recruiter.companyName = companyName;
        if (companyWebsite) recruiter.companyWebsite = companyWebsite;
        if (number) recruiter.number = number;
        if (designation) recruiter.designation = designation;
        if (industry) recruiter.industry = industry;
        if (linkedInProfile) recruiter.linkedInProfile = linkedInProfile;

        const updatedRecruiter = await recruiter.save();

        res.status(200).json({
            messsage: "Recruiter updated successfully",
            recruiter: {
                name: updatedRecruiter.name,
                email: updatedRecruiter.email,
                companyName: updatedRecruiter.companyName,
                companyWebsite: updatedRecruiter.companyWebsite,
                number: updatedRecruiter.number,
                designation: updatedRecruiter.designation,
                industry: updatedRecruiter.industry,
                linkedInProfile: updatedRecruiter.linkedInProfile
            }
        })
    } catch (error) {
        res.status(500).json({ message: " Error Updating recruiter" })
    }
}

