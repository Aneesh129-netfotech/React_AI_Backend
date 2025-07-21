import Recruiter from "../Models/Recruiter.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'})
};

export const registerRecruiter = async (req, res) => {
    const {name,email,company,phone,password}=req.body;
    try{
        const recruterExists= await Recruiter.findOne({email});
        if(recruterExists){
            return res.status(400).json({message:"Recruiter already exists"});
        }

        const hashedPassword= await bcrypt.hash(password,6);
        const recruiter= await Recruiter.create({
            name,
            email,
            company,
            phone,
            password:hashedPassword
        });

        res.status(201).json({
            _id: recruiter._id,
            name: recruiter.name,
            email: recruiter.email,
            company: recruiter.company,
            phone: recruiter.phone,
        });
    }
    catch(error){
        console.error("Error registering recruiter:", error);
        res.status(500).json({message:"Internal server error"});
    }
};


export const LoginRecruiter= async(req,res)=>{
    const {email, password}=req.body;
    try{
        const recruiter=await Recruiter.findOne({email});
        if(!recruiter){
            return res.status(400).json({message:"Recruiter not found"});
        }

        const isMatch= await bcrypt.compare(password,recruiter.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"});
        }

        res.status(200).json({
            _id: recruiter._id,
            name: recruiter.name,
            email: recruiter.email,
            company: recruiter.company,
            phone: recruiter.phone,
            token: generateToken(recruiter._id)
        });
    }
    catch(error){
        console.error("Error logging in recruiter:", error);
        res.status(500).json({message:"Internal server error"});
    }
}

export const getRecruiterProfile= async(req,res)=>{
    const recruiter=await Recruiter.findById(req.user.id).select("-password");
    res.json(recruiter);
};

export const LogoutRecruiter = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // Expire the cookie immediately
    secure:true,
    sameSite:"Strict"
  });
  req.user = null;
  res.json({ message: "Recruiter Logged out successfully" });
};

