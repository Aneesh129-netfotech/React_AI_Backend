import Candidate from "../Models/CandidateRegister.js";
import CandidateAddition from "../Models/CandidateAdditiondetails.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import JD from "../Models/JdSchema.js";
// mport { cloudinary } from "../../config/cloudinary.js";


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
};

export const registerCandidate = async (req, res) => {
    const { name, email, password, number, linkedInProfile } = req.body;

    if (!name || !email || !password || !number || !linkedInProfile)
        return res.status(401).json({ message: "Missing Required Fields" })

    try {
        const candidateExists = await Candidate.findOne({ email });
        if (candidateExists) {
            return res.status(400).json({ message: "Candidate already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 6);
        const candidate = await Candidate.create({
            name,
            email,
            password: hashedPassword,
            number,
            linkedInProfile

        });

        res.status(201).json({
            _id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            number: candidate.number,
            linkedInProfile: candidate.linkedInProfile,
        });
    }
    catch (error) {
        console.error("Error registering candidate:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const loginCandidate = async (req, res) => {
    const { email, password } = req.body;
    try {
        const candidate = await Candidate.findOne({ email });
        if (!candidate) {
            return res.status(400).json({ message: "Candidate not found" });
        }

        const isMatch = await bcrypt.compare(password, candidate.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.status(200).json({
            _id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            number: candidate.number,
            linkedInProfile: candidate.linkedInProfile,
            token: generateToken(candidate._id)
        });
    }
    catch (error) {
        console.error("Error logging in candidate:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// export const applyToSpecificJD = async (req, res) => {
//     const { jobId } = req.params;
//     const candidateId = req.user.id;

//     try {
//         const candidate = await Candidate.findById(candidateId);
//         if (!candidate) {
//             return res.status(404).json({ message: "Candidate not found" });
//         }

//         const application = await CandidateAddition.create({
//             candidateId,
//             jobId,
//             ...req.body
//         });

//         res.status(201).json(application);
//     }
//     catch (error) {
//         console.error("Error applying to job:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };


// export const applyToSpecificJD = async (req, res) => {
//     const { jobId } = req.params;
//     // const candidateId = req.user.id;
//     // console.log("candidateId---->", candidateId);

//     const {
//         skills,
//         currentCTC,
//         expectedCTC,
//         currentLocation,
//         relocation,
//         noticePeriod,
//         linkedInProfile,
//     } = req.body;

//     try {
//         const candidate = await Candidate.findById("68b81b43ce44fe8478964516");
//         if (!candidate) {
//             return res.status(404).json({ message: "Candidate not found" });
//         }

//         // Check for uploaded file
//         if (!req.file || !req.file.path) {
//             return res.status(400).json({ message: "Resume file is required" });
//         }

//         const resumeUrl = req.file.path;

//         const application = await CandidateAddition.create({
//             candidateId: "68b81b43ce44fe8478964516",
//             jobId,
//             resume: resumeUrl,
//             skills,
//             currentCTC,
//             expectedCTC,
//             currentLocation,
//             relocation,
//             noticePeriod,
//             linkedInProfile,
//         });

//         res.status(201).json(application);
//     } catch (error) {
//         console.error("Error applying to job:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };



export const applyToSpecificJD = async (req, res) => {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    const {
        skills,
        currentCTC,
        expectedCTC,
        currentLocation,
        relocation,
        noticePeriod,
        linkedInProfile,
    } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: "Resume file is required" });
        }

        // Upload the file to Cloudinary as a RAW file
        const cloudResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'raw',
            folder: 'resumes',
        });

        // Delete the local file after upload
        fs.unlinkSync(req.file.path);

        const resumeUrl = cloudResult.secure_url;

        const application = await CandidateAddition.create({
            candidateId: candidateId,
            jobId,
            resume: resumeUrl,
            skills,
            currentCTC,
            expectedCTC,
            currentLocation,
            relocation,
            noticePeriod,
            linkedInProfile,
        });

        res.status(201).json({
            message: 'Application submitted successfully',
            application,
        });
    } catch (error) {
        console.error("Error applying to job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const changeStatusOfAllFileredCandidate = async (req, res) => {
    const { jobId } = req.params;
    const { status } = req.body;
    try {
        const updatedCandidates = await JD.updateMany(
            { _id: jobId },
            { $set: { "filteredResumes.$[].status": status } },
            { new: true }
        );
        res.status(200).json({
            message: "Status updated successfully",
            updatedCandidates
        });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
