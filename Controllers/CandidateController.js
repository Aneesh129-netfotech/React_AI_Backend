import Candidate from "../Models/CandidateRegister.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


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