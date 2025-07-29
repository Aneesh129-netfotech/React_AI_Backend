import Admin from '../Models/AdminSchema.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Recruiter from '../Models/Recruiter.js'

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export const registerAdmin = async (req, res) => {
    const { name, email, password, number } = req.body;
    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 6);
        const admin = await Admin.create({
            name,
            email,
            number: number,
            password: hashedPassword
        });
        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            number: admin.number,
        });

    }
    catch (error) {
        console.error("Error registering admin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: "Admin not found" });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        res.status(200).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            number: admin.number,
            token: generateToken(admin._id)
        });
    }
    catch (error) {
        console.error("Error logging in admin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllRecruiters = async (req, res) => {
    try {
        const recruiters = await Recruiter.find().select("-password");
        res.status(200).json({ message: "All recruiters fetched successfully", recruiters })
    } catch (error) {
        console.log("Error fetching recruiters", error)
        res.status(500).json({ message: "Failed to fetch Recruiters", error: error.message })
    }
}

