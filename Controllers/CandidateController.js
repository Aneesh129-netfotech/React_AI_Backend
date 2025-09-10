import Candidate from "../Models/CandidateRegister.js";
import CandidateAddition from "../Models/CandidateAdditiondetails.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import JD from "../Models/JdSchema.js";
import CandidateRegister from "../Models/CandidateRegister.js";
import { application } from "express";
// mport { cloudinary } from "../../config/cloudinary.js";


const generateToken = (candidate) => {
  return jwt.sign(
    { id: candidate._id, email: candidate.email }, 
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

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

        const additionalDetails = await CandidateAddition.findOne({ candidateId: candidate._id });

        res.status(200).json({
            _id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            number: candidate.number,
            linkedInProfile: candidate.linkedInProfile,
            hasAdditionalDetails: !! additionalDetails,
            token: generateToken(candidate),
        });
    }
    catch (error) {
        console.error("Error logging in candidate:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const addCandidateDetails = async(req,res) => {
    try {
        const candidateId = req.user.id; 
        const { skills, currentCTC, expectedCTC, currentLocation, relocation, noticePeriod } = req.body;

        const existingDetails = await CandidateAddition.findOne({ candidateId });
        if(existingDetails){
            return res.status(400).json({ message: "Additional details already exist for this candidate" });
        }

        const candidateAddition = new CandidateAddition({
            candidateId,
            skills,
            currentCTC,
            expectedCTC,
            currentLocation,
            relocation,
            noticePeriod,
        });

        await candidateAddition.save();
        await CandidateRegister.findByIdAndUpdate(candidateId, { candidateAdditiondetails: candidateAddition._id });

        res.status(201).json({ message: "Candidate Additional Details Saved Successfully", data: candidateAddition });
    } catch (error) {
        res.status(500).json({ message: "Error saving additional details", error: error.message });
    }
};



export const getCandidateProfile = async(req,res) => {
    try {
        const candidateId = req.user._id;
        const candidate = await CandidateRegister.findById(candidateId)
        .select("-password")
        .populate("candidateAdditiondetails");

        // if(!candidate){
        //     return res.status(404).json({message:"candidate Not Found"});
        // }
        res.status(200).json({
            message:"candidate profile fetched successfully",candidate,
        });
    } catch (error) {
        res.status(500).json({message:"Error Fetching Candidate Profile",error:error.message});
    }
};

export const updateCandidateProfile = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const {
      name,
      email,
      number,
      skills,
      currentCTC,
      expectedCTC,
      currentLocation,
      relocation,
      noticePeriod,
      linkedInProfile,
    } = req.body;
 
    // 🔹 Step 1: Update CandidateRegister (basic info)
    const candidate = await CandidateRegister.findByIdAndUpdate(
      candidateId,
      { name, email, number,linkedInProfile },
      { new: true }
    ).select("-password");
 
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
 
    // 🔹 Step 2: Update CandidateAddition (additional info)
    let additionalDetails;
    if (candidate.candidateAdditiondetails) {
      // already exists → update
      additionalDetails = await CandidateAddition.findByIdAndUpdate(
        candidate.candidateAdditiondetails,
        {
          skills,
          currentCTC,
          expectedCTC,
          currentLocation,
          relocation,
          noticePeriod,
        },
        { new: true }
      );
    } else {
      // not exists → create
      additionalDetails = new CandidateAddition({
        candidateId,
        skills,
        currentCTC,
        expectedCTC,
        currentLocation,
        relocation,
        noticePeriod,
      });
      await additionalDetails.save();
 
      // link back to CandidateRegister
      candidate.candidateAdditiondetails = additionalDetails._id;
      await candidate.save();
    }
 
    res.status(200).json({
      message: "Candidate profile updated successfully",
      candidate: {
        ...candidate.toObject(),
        candidateAdditiondetails: additionalDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating candidate profile", error: error.message });
  }
};




export const applyToSpecificJD = async (req, res) => {
    const { jobId } = req.params;
    const candidateId = req.user._id;

    console.log("candidateId---->", candidateId);
    

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
        const candidate = await CandidateRegister.findById(candidateId);
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

        const jd = await JD.findById(jobId);
        if(!jd){
            return
            res.status(404).json({message:"Job Not Found"});
        }

        const newApplication = {
            candidate: candidateId,
            jobId,
            resume: resumeUrl,
            skills,
            currentCTC,
            expectedCTC,
            currentLocation,
            relocation,
            noticePeriod,
            linkedInProfile,
            status:"pending",
        };

        jd.applications.push(newApplication);
        await jd.save();

        res.status(201).json({
            message: 'Application submitted successfully',
            application:newApplication,
        });
    } catch (error) {
        console.error("Error applying to job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllCandidatesdataAccordingToJD = async(req,res) => {
    try {
        const {jobId} = req.params;
        const jd = await JD.findById(jobId).populate({
            path: "applications.candidate",
            select: "name email"
        });

        if (!jd) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json({
            message: "Candidates fetched successfully",
            candidates: jd.applications
        });
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllAppliedJobs = async(req,res) => {
    try {
        const candidateId = req.user._id;
        const jobs = await JD.find({"applications.candidate": candidateId})
        const specificItems = jobs.map(job => {
            const application = job.applications.find(app => app.candidate.toString() === candidateId.toString());
            return {
                jobId: job._id,
                recruiter:job.recruiter,
                title: job.title,
                experience:job.experience,
                skills: job.skills,
                qualification:job.Qualification,
                empType:job.employmentType,
                location: job.location,
                salary: job.salaryRange,
                fullJD:job.fullJD,
                jobSummary:job.jobSummary
            };
        });
        res.status(200).json({message:"Applied Jobs fetched successfully", specificItems});
    } catch (error) {
        console.error("Error fetching applied jobs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateCandidateAdditionalDetails = async(req,res) => {
    try {
        const {candidateId} = req.params;
        const {skills, currentCTC, expectedCTC, currentLocation, relocation, noticePeriod} = req.body;
        const additionalDetails = await CandidateAddition.findOneAndUpdate(
            {candidateId},
            {skills, currentCTC, expectedCTC, currentLocation, relocation, noticePeriod},
            {new: true, upsert: true}
        );

        res.status(200).json({
            message: "Candidate additional details updated successfully.",
            additionalDetails
        });
    } catch (error) {
        console.error("Error updating candidate additional details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateCandidateBasicDetails = async(req,res) => {
    try {
        const {candidateId} = req.params;
        const {name, email, number, linkedInProfile} = req.body;
        const candidate = await CandidateRegister.findByIdAndUpdate(
            candidateId,
            {name, email, number, linkedInProfile},
            {new: true}
        ).select("-password");
        if(!candidate){
            return res.status(404).json({message:"Candidate Not Found"});
        }
        res.status(200).json({
            message: "Candidate basic details updated successfully.",
            candidate
        });
    } catch (error) {
        console.error("Error updating candidate basic details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCandidateAdditionalDetails = async(req,res) => {
    try {
        const {candidateId} = req.params;
        const additionalDetails = await CandidateAddition.findOne({candidateId});

        if (!additionalDetails) {
            return res.status(404).json({ message: "Additional details not found" });
        }

        res.status(200).json({
            message: "Candidate additional details fetched successfully.",
            additionalDetails
        });
    } catch (error) {
        console.error("Error fetching candidate additional details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
