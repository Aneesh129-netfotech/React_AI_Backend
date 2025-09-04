import mongoose from "mongoose";

const candidateAdditionSchema = new mongoose.Schema({

      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CandidateRegister",
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JD", // or whatever your Job model is called
        required: true
    },
   
    resume: {
        type: String,
        required: true
    },
    skills:{
        type: String,
    },
    currentCTC:{
        type: String,
    },
    expectedCTC:{
        type: String,
    },
    currentLocation:{
        type: String,
    },
    relocation:{
        type: String,
    },
    noticePeriod:{
        type: String,
    },
    linkedInProfile: {
        type: String,
    },
    status:{
        enum:["Pending","Resume Shortlisted","Rejected","Selected"],
        type: String,
        default:"Pending"
    }
}, { timestamps: true });

const CandidateAddition = mongoose.model("CandidateAddition", candidateAdditionSchema);
export default CandidateAddition;
