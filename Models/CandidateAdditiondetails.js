import mongoose from "mongoose";

const candidateAdditionSchema = new mongoose.Schema({

 candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CandidateRegister",
        required: true
    },
    skills:[{type:String}],
    
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
}, { timestamps: true });

const CandidateAddition = mongoose.model("CandidateAddition", candidateAdditionSchema);
export default CandidateAddition;
