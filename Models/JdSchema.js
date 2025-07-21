import mongoose from "mongoose";

const FilteredResumeSchema= new mongoose.Schema({
    fileName: String,
    matchSummary: String,
    summary:String,
    date:{
        type: Date, default:Date.now
    }
})

const jdSchema = new mongoose.Schema({
    recruiter: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter',required: true},
    title: String,
    experience : Number,
    skills: [String],
    location: String,
    company: String,
    employmentType: String,
    salaryRange: String,
    fullJD: String,
    FilteredResumeSchema: [FilteredResumeSchema],
    createdAt:{
        type: Date,
        default: Date.now
    }
})

const JD = mongoose.model("Jd", jdSchema);
export default JD;