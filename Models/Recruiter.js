import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true,
    },
    companyWebsite: {
        type: String,
    },
    number: {
        type: String,
        required: true,
    },
    designation: {
        type: String,
        required: true,
    },
    industry: {
        type: String,
    },
    linkedInProfile: {
        type: String,
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
}, { timestamps: true });

const Recruiter = mongoose.model("Recruiter", recruiterSchema);
export default Recruiter;