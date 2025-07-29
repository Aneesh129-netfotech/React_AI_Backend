import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    score:{
        type: Number,
        required: true,
        min:0,
        max:100,
    },
    jdId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Jd",
        required: true,
    },
    testSent:{
        type: Boolean,
        default: false,
    },
},{timestamps: true});

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;