import mongoose from "mongoose";

const resumeSchema= new mongoose.Schema({
    fileName: String,
    matchSummary: String,
    matchPercentage: Number,
    resumeMatch: String,
    name: String,
    email: String,
    skills: [{type:String}],
    experience:String
})

const jdSchema = new mongoose.Schema({
    recruiter: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter',required: true},
    title: String,
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
    createdAt:{
        type: Date,
        default: Date.now
    }
})

const JD = mongoose.model("Jd", jdSchema);
export default JD;