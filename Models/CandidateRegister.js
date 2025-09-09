import mongoose from "mongoose";

const candidateRegisterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true,
    },
    candidateAdditiondetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CandidateAddition",
    },
}, { timestamps: true });

const CandidateRegister = mongoose.model("CandidateRegister", candidateRegisterSchema);
export default CandidateRegister;