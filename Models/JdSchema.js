import mongoose from "mongoose";
import CandidateRegister from "./CandidateRegister.js";
import { application } from "express";


const applicationSchema = new mongoose.Schema({
    candidate:{type:mongoose.Schema.Types.ObjectId,
        ref:"CandidateRegister",
        required:true
    },
    resume:{type:String, required:true},
    skills:[String],
    currentCTC:String,
    expectedCTC:String,
    currentLocation:String,
    relocation:{type:Boolean, default:false},
    noticePeriod:String,
    linkedInProfile:String,
    status:{
        type:String,
        enum:["pending","shortlisted","rejected"],
        default:"pending"
    },
    appliedAt:{
        type:Date,
        default:Date.now
    }

});

const resumeSchema= new mongoose.Schema({
    fileName: String,
    matchSummary: String,
    matchPercentage: Number,
    resumeMatch: String,
    name: String,
    email: String,
    skills: [{type:String}],
    experience:String,
   
})

const jdSchema = new mongoose.Schema({
    recruiter: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter',required: true},
    title: String,
    company:String,
    experience : String,
    skills: [String],
    location: String,
    Qualification: String,
    employmentType: String,
    salaryRange: String,
    fullJD: String,
    jobSummary: String,
    filteredResumes: [resumeSchema],
    unfilteredResumes: [resumeSchema],
    applications:[applicationSchema],
    createdAt:{
        type: Date,
        default: Date.now
    }
})

const JD = mongoose.model("Jd", jdSchema);
export default JD;