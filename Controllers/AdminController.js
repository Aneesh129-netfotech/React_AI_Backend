import Admin from '../Models/AdminSchema.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Recruiter from '../Models/Recruiter.js'
import Candidate from '../Models/Candidate.js'
import JD from '../Models/JdSchema.js';

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

export const getAllApplicants = async (req, res) => {
    try {
        const Candidates = await Candidate.find().select("-password");
        res.status(200).json({ message: "All Candidates fetched successfully", Candidates })
        const count = await Candidate.countDocuments();
        console.log("Total number of candidates:", count);
    } catch (error) {
        console.log("Error fetching Candidates", error)
        res.status(500).json({ message: "Failed to fetch Candidates", error: error.message })
    }
}

export const getAlldata = async(req,res)=>{
    try{

        const recruites= await Recruiter.find().select("-password");
        const candidates= await Candidate.find().select("-password");
        const jd= await JD.find().populate('recruiter', 'name');
        const Candidate_count = await Candidate.countDocuments();
        const Recruiter_count = await Recruiter.countDocuments();
        const countJd = await JD.countDocuments();
        res.status(200).json({message:"All data fetched successfully",Candidate_count,Recruiter_count,countJd})
    }
    catch(error){
        console.log("Error fetching data", error)
        res.status(500).json({ message: "Failed to fetch data", error: error.message })
    }
}
export const deleteRecruiter = async (req, res) => {
    const { id } = req.params;
    try {
        const recruiter = await Recruiter.findById(id);
        if (!recruiter) {
            return res.status(404).json({ message: "recruiter not found" });
        }
        await Recruiter.findByIdAndDelete(id);
        res.status(200).json({ message: "recruiter deleted successfully" });
    } catch (error) {
        console.error("Error deleting recruiter:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteApplicant = async (req, res) => {
    const { id } = req.params;
    try {
        const candidate = await Candidate.findById(id);
        if (!candidate) {
            return res.status(404).json({ message: "candidate not found" });
        }
        await Candidate.findByIdAndDelete(id);
        res.status(200).json({ message: "candidate deleted successfully" });
    } catch (error) {
        console.error("Error deleting candidate:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllJD = async (req, res) => {
    try {
        const Jd = await JD.find().select('_id title skills fullJD company location');
        res.status(200).json({ message: "All JD fetched successfully", Jd })
    } catch (error) {
        console.log("Error fetching JD", error);
        res.status(500).json({ message: "Failed to fetch JD", error: error.message })
    }
}

// export const getAllsJD = async(req,res)=>{
//     try{
//         const jd= await JD.find().populate('fullJD');
//         jd.map((item) => {
//            item.skills = item.skills || "No skills available";
//         });
//         res.status(200).json({message:"All JD fetched successfully",item})
//     }
//     catch(error){
//         console.log("Error fetching JD", error);
//         res.status(500).json({ message: "Failed to fetch JD", error: error.message })
//     }
// }


export const getJobById = async (req, res) => {
    try {
        const id = req.params.id;
        const job = await JD.findById(id).populate("recruiter", "name");
        res.status(200).json({ message: "Successfully Fetched Job", job });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch Job", error: error.message })
    }
}

