import JD from "../Models/JdSchema.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import pdfParse from "pdf-parse";
import { extractCandidateDetails } from "../Utils/extractCandidateDetails.js";
import Candidate from "../Models/Candidate.js";
import axios from "axios";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//   try {
//     const
//     const jdText = req.body.jdText;
//     const files = req.files;

//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: 'No resumes uploaded.' });
//     }

//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//     const results = [];

//     for (const file of files) {
//       const filePath = file.path;
//       const pdfBuffer = fs.readFileSync(filePath);
//       const pdfText = (await pdfParse(pdfBuffer)).text;

//       const prompt = `
// Compare the following resume with this job description.
// Give:
// 1. A match percentage (out of 100)
// 2. Key matching skills
// 3. Whether the candidate is a good fit (Yes/No)

// ### Job Description:
// ${jdText}

// ### Resume:
// ${pdfText}
// `;

//       const result = await model.generateContent(prompt);
//       const matchSummary = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available';

//       results.push({
//         fileName: file.originalname,
//         matchSummary,
//       });

//       fs.unlinkSync(filePath);
//     }

//     res.status(200).json({ results });

//   } catch (error) {
//     console.error('Error in filterJd:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// export const deleteJd = async(req,res)=>{
//   const {id}= req.params;
//   try{
//     const jd= await JD.findById(id);
//     if(!jd){
//       return res.status(404).json({message: "JD is not found"});
//     }
//     await JD.findByIdAndDelete(id);
//     res.status(200).json({message: "JD deleted successfully"});
//   }
//   catch(error){
//     console.error("Error deleting JD:", error);
//     res.status(500).json({message: "Internal server error"});
//   }
// }

// export const filterJD = async (req, res) => {
//   try {
//     const jdId = req.body.jdId;
//     const jdText = req.body.jdText;
//     const files = req.files;

//     if (!jdId || !jdText) {
//       return res.status(400).json({ error: 'jdId and jdText are required.' });
//     }

//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: 'No resumes uploaded.' });
//     }

//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//     const results = [];

//     for (const file of files) {
//       const filePath = file.path;
//       const pdfBuffer = fs.readFileSync(filePath);
//       const pdfText = (await pdfParse(pdfBuffer)).text;

//       const prompt = `
// Compare the following resume with this job description. Give:
// 1. A match percentage (out of 100)
// 2. Key matching skills
// 3. Whether the candidate is a good fit (Yes/No)

// ### Job Description:
// ${jdText}

// ### Resume:
// ${pdfText}
//       `;

//       const result = await model.generateContent(prompt);
//       const matchSummary = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available';

//       const match = matchSummary.match(/(\d+)%/);
//       const matchPercentage = match ? parseInt(match[1]) : 0;

//       if (matchPercentage >= 70) {
//         results.push({
//           fileName: file.originalname,
//           matchSummary,
//           matchPercentage,
//           resumeText: pdfText,
//         });
//       }

//       fs.unlinkSync(filePath);
//     }

//     const jd = await JD.findById(jdId);
//     if (!jd) {
//       return res.status(404).json({ error: 'JD not found.' });
//     }

//     jd.filteredResumes = jd.filteredResumes.concat(results);
//     await jd.save();

//     res.status(200).json({
//       message: 'Filtered resumes (>=70%) saved successfully.',
//       savedCount: results.length,
//       filtered: results,
//     });

//   } catch (error) {
//     console.error('Error in filterJD:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

export const generateJD = async (req, res) => {
  const {
    title,
    experience,
    skills,
    location,
    Qualification,
    employmentType,
    salaryRange,
  } = req.body;

  if (!req.user || !req.user.email || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User info missing." });
  }

  const recruiterEmail = req.user.email;

  const jdPrompt = `
Write a professional job description using the following:
- Job Title: ${title}
- Required Experience: ${experience} years
- Skills: ${skills.join(", ")}
- Location: ${location}
- Qualification: ${Qualification}
- Employment Type: ${employmentType}
${salaryRange ? `- Salary Range: ${salaryRange}` : ""}
 
Include:
1. Company Overview
2. Job Summary
3. Required Skills
4. Preferred Skills
5. Perks & Benefits
6. How to Apply (Email: ${recruiterEmail})
 
Use markdown formatting and bullet points .
`;

  const summaryPrompt = `
Summarize the following job requirements in 3-5 lines. Only include Job Title, Required Experience, and Skills.
Do not include company name, location, salary, employment type, or any other information.
 
- Job Title: ${title}
- Experience: ${experience} years
- Skills: ${skills.join(", ")}
 
Only return the summary — no heading or bullet points.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const jdResult = await model.generateContent(jdPrompt);
    const jdText = jdResult.response.text();

    const summaryResult = await model.generateContent(summaryPrompt);
    const jobSummary = summaryResult.response.text().trim();

    const newJD = await JD.create({
      recruiter: req.user._id,
      title,
      experience,
      skills,
      location,
      Qualification,
      employmentType,
      salaryRange,
      fullJD: jdText,
      jobSummary,
    });

    res.status(201).json({
      message: "JD and jobSummary generated successfully.",
      jd: newJD,
    });
  } catch (err) {
    console.error("Gemini JD Generation Error:", err?.message || err);
    res.status(500).json({ message: "Gemini JD generation failed." });
  }
};

export const deleteJd = async (req, res) => {
  const { id } = req.params;
  try {
    const jd = await JD.findById(id);
    if (!jd) {
      return res.status(404).json({ message: "JD not found" });
    }
    await JD.findByIdAndDelete(id);
    res.status(200).json({ message: "JD deleted successfully" });
  } catch (error) {
    console.error("Error deleting JD:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//   try {
//     const jdId = req.body.jdId;
//     const jdText = req.body.jdText;
//     const files = req.files;

//     if (!jdId || !jdText) {
//       return res.status(400).json({ error: 'jdId and jdText are required.' });
//     }

//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: 'No resumes uploaded.' });
//     }

//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//     const filteredResults = [];
//     const unfilteredResults = [];

//     for (const file of files) {
//       const filePath = file.path;
//       const pdfBuffer = fs.readFileSync(filePath);
//       const pdfText = (await pdfParse(pdfBuffer)).text;

//       const prompt = `
// Compare the following resume with this job description. Give:
// 1. A match percentage (out of 100)
// 2. Key matching skills
// 3. Whether the candidate is a good fit (Yes/No)

// ### Job Description:
// ${jdText}

// ### Resume:
// ${pdfText}
//       `;

//       const result = await model.generateContent(prompt);
//       const matchSummary = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available';
//       const match = matchSummary.match(/(\d+)%/);
//       const matchPercentage = match ? parseInt(match[1]) : 0;

//       const resumeData = {
//         fileName: file.originalname,
//         matchSummary,
//         matchPercentage,
//         resumeText: pdfText,
//       };

//       if (matchPercentage >= 70) {
//         filteredResults.push(resumeData);
//       } else {
//         unfilteredResults.push(resumeData);
//       }

//       fs.unlinkSync(filePath);
//     }

//     const jd = await JD.findById(jdId);
//     if (!jd) return res.status(404).json({ error: 'JD not found.' });

//     jd.filteredResumes = jd.filteredResumes.concat(filteredResults);
//     jd.unfilteredResumes = jd.unfilteredResumes.concat(unfilteredResults);
//     await jd.save();

//     res.status(200).json({
//       message: 'Resumes filtered and saved.',
//       savedFiltered: filteredResults.length,
//       savedUnfiltered: unfilteredResults.length,
//       filtered: filteredResults,
//       unfiltered: unfilteredResults,
//     });
//   } catch (error) {
//     console.error('Error in filterJD:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

export const generateQuestionsFromJD = async (req, res) => {
  const { jdText } = req.body;
  if (!jdText) {
    return res.status(400).json({ message: "JD text is required" });
  }

  try {
    const prompt = `Generate 10 technical interview questions which consist MCQ questions as well as Give the output on the Above Code question based on the following job description:\m\n${jdText}\n\n
Format the questions in a numbered list and give me in formet manner`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const questionsText = response.text();

    res.status(200).json({
      message: "Questions generated successfully.",
      questions: questionsText,
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ message: "Failed to generate questions." });
  }
};

// export const filterJD = async (req, res) => {
//   try {
//     const { jdId, jdText } = req.body;
//     const files = req.files;
 
//     if (!jdId || !jdText) {
//       return res.status(400).json({ error: "jdId and jdText are required." });
//     }
 
//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: "No resumes uploaded." });
//     }
 
//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
 
//     const filteredResults = [];
//     const unfilteredResults = [];
 
//     for (const file of files) {
//       const filePath = file.path;
//       const pdfBuffer = fs.readFileSync(filePath);
//       const pdfText = (await pdfParse(pdfBuffer)).text;
 
//       const prompt = `
// Compare the following resume with this job description. Give:
// 1. A match percentage (out of 100)
// 2. Key matching skills
// 3. Whether the candidate is a good fit (Yes/No)
 
// Job Description:
// ${jdText}
 
// Resume:
// ${pdfText}
//       `;
 
//       const result = await model.generateContent(prompt);
//       const matchSummary = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "No summary available";
//       const match = matchSummary.match(/(\d+)%/);
//       const matchPercentage = match ? parseInt(match[1]) : 0;
 
//       const { name, email, skills, experience } = extractCandidateDetails(pdfText);
 
//       const resumeData = {
//         fileName: file.originalname,
//         matchSummary,
//         matchPercentage,
//         name: name || "Unknown",
//         email: email || "Not found",
//         skills,
//         experience,
//         resumeText: pdfText,
//       };
 
//       if (matchPercentage >= 70 && email) {
//         await Candidate.create({
//           name,
//           email,
//           score: matchPercentage,
//           jdId,
//           testSent: false,
//           skills,
//           experience,
//         });
//         filteredResults.push(resumeData);
//       } else {
//         unfilteredResults.push(resumeData);
//       }
 
//       fs.unlinkSync(filePath); // cleanup file
//     }
 
//     const jd = await JD.findById(jdId);
//     if (!jd) return res.status(404).json({ error: "JD not found." });
 
//     // Ensure arrays exist
//     jd.filteredResumes = jd.filteredResumes || [];
//     jd.unfilteredResumes = jd.unfilteredResumes || [];
 
//     // Collect existing emails to prevent duplicates
//     const existingEmails = new Set([
//       ...jd.filteredResumes.map(r => r.email),
//       ...jd.unfilteredResumes.map(r => r.email),
//     ]);
 
//     const newFiltered = filteredResults.filter(r => !existingEmails.has(r.email));
//     const newUnfiltered = unfilteredResults.filter(r => !existingEmails.has(r.email));
 
//     jd.filteredResumes = jd.filteredResumes.concat(newFiltered);
//     jd.unfilteredResumes = jd.unfilteredResumes.concat(newUnfiltered);
 
//     await jd.save();
 
//     res.status(200).json({
//       message: "Resumes filtered and candidates stored.",
//       savedFiltered: newFiltered.length,
//       savedUnfiltered: newUnfiltered.length,
//       filtered: newFiltered,
//       unfiltered: newUnfiltered,
//     });
 
//   } catch (error) {
//     console.error("Error in filterJD:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


export const filterJD = async (req, res) => {
  try {
    const { jdId, jdText } = req.body;
    const files = req.files;

    if (!jdId || !jdText) {
      return res.status(400).json({ error: "jdId and jdText are required." });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No resumes uploaded." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const filteredResults = [];
    const unfilteredResults = [];

    for (const file of files) {
      const filePath = file.path;
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfText = (await pdfParse(pdfBuffer)).text;

      const prompt = `
Compare the following resume with this job description. Give:
1. A match percentage (out of 100)
2. Key matching skills
3. Whether the candidate is a good fit (Yes/No)
 
### Job Description:
${jdText}
 
### Resume:
${pdfText}
      `;

      const result = await model.generateContent(prompt);
      const matchSummary =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No summary available";
      const match = matchSummary.match(/(\d+)%/);
      const matchPercentage = match ? parseInt(match[1]) : 0;

      const { name, email, skills, experience } =
        extractCandidateDetails(pdfText);

      const resumeData = {
        fileName: file.originalname,
        matchSummary,
        matchPercentage,
        name: name || "Unknown",
        email: email || "Not found",
        skills: skills,
        experience: experience,
        resumeText: pdfText,
      };

      if (matchPercentage >= 70 && email) {
        await Candidate.create({
          name,
          email,
          skills,
          experience,
          score: matchPercentage,
          jdId,
          testSent: false, // only storing, not sending test yet
        });

        filteredResults.push(resumeData);
      } else {
        unfilteredResults.push(resumeData);
      }

      fs.unlinkSync(filePath); // delete uploaded file after processing
    }

    const jd = await JD.findById(jdId);
    if (!jd) return res.status(404).json({ error: "JD not found." });

    jd.filteredResumes = jd.filteredResumes.concat(filteredResults);
    jd.unfilteredResumes = jd.unfilteredResumes.concat(unfilteredResults);
    await jd.save();

    res.status(200).json({
      message: "Resumes filtered and candidates stored.",
      savedFiltered: filteredResults.length,
      savedUnfiltered: unfilteredResults.length,
      filtered: filteredResults,
      unfiltered: unfilteredResults,
    });
  } catch (error) {
    console.error("Error in filterJD:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getResumesByJdId = async (req, res) => {
  const { jdId } = req.params;

  try {
    const jd = await JD.findById(jdId);

    if (!jd) {
      return res.status(404).json({ message: "JD not found" });
    }

    res.status(200).json({
      filtered: jd.filteredResumes || [],
      unfiltered: jd.unfilteredResumes || [],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadJDPfd = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = file.path;
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfText = (await pdfParse(pdfBuffer)).text;

    fs.unlinkSync(filePath);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Step 1: Extract structured info from raw PDF text
    const extractionPrompt = `
You are an AI recruiter assistant. Extract key job information from the following raw job description:
 
Content:
${pdfText}
 
Return in JSON format only (no explanation) with keys:
{
  "title": "",
  "experience": "",
  "skills": [],
  "location": "",
  "Qualification": "",
  "employmentType": "",
  "salaryRange": ""
}
    `;

    const extractionResult = await model.generateContent(extractionPrompt);
    const extractedText = extractionResult.response.text().trim();

    let structuredData;
    try {
      const cleanedJson = extractedText
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      structuredData = JSON.parse(cleanedJson);
    } catch (err) {
      console.error("Error parsing extracted JSON:", err);
      return res
        .status(400)
        .json({
          message: "Could not extract structured data from JD.",
          raw: extractedText,
        });
    }
    const {
      title,
      experience,
      skills,
      location,
      Qualification,
      employmentType,
      salaryRange,
    } = structuredData;

    if (!req.user || !req.user.email || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User info missing." });
    }

    const recruiterEmail = req.user.email;

    const jdPrompt = `
Write a professional job description using the following:
 
- Job Title: ${title}
- Required Experience: ${experience} years
- Skills: ${skills.join(", ")}
- Location: ${location}
- Qualification: ${Qualification}
- Employment Type: ${employmentType}
${salaryRange ? `- Salary Range: ${salaryRange}` : ""}
 
Include:
1. Company Overview
2. Job Summary
3. Required Skills
4. Preferred Skills
5. Perks & Benefits
6. How to Apply (Email: ${recruiterEmail})
 
Use markdown formatting and bullet points.
    `;

    const jdResult = await model.generateContent(jdPrompt);
    const fullJD = jdResult.response.text();

    const summaryPrompt = `
Summarize the following job requirements in 3-5 lines. Only include Job Title, Required Experience, and Skills.
Do not include company name, location, salary, employment type, or any other information.
 
- Job Title: ${title}
- Experience: ${experience} years
- Skills: ${skills.join(", ")}
 
Only return the summary — no heading or bullet points.
    `;

    const summaryResult = await model.generateContent(summaryPrompt);
    const jobSummary = summaryResult.response.text().trim();

    const newJD = await JD.create({
      recruiter: req.user._id,
      title,
      experience,
      skills,
      location,
      Qualification,
      employmentType,
      salaryRange,
      fullJD,
      jobSummary,
    });

    res.status(201).json({
      message: "JD extracted, formatted, and saved successfully.",
      jd: newJD,
    });
  } catch (error) {
    console.error("Error processing JD PDF:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// export const getallJDs = async (req, res) => {
//   try {
//     const jds = await JD.find({ recruiter: req.user._id }).populate('recruiter', 'name email');
//     res.status(200).json
//   } catch (error) {
//     console.error("Error fetching JDs:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// }
export const getallJDs = async (req, res) => {
  try {
    const jds = await JD.find({ recruiter: req.user._id })
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
    res.status(200).json({
      message: "All JDs fetched successfully",
      jds,
    });
  } catch (error) {
    console.error("Error fetching JDs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getJDById = async (req, res) => {
  const { id } = req.params;
  try {
    const jd = await JD.findById(id).populate("recruiter", "name email");
    if (!jd) {
      return res.status(404).json({ message: "JD not found" });
    }
    res.status(200).json({
      _id: jd._id,
      title: jd.title,
      jobSummary: jd.jobSummary,
      createdAt: jd.createdAt,
      recruiter: {
        name: jd.recruiter.name,
        email: jd.recruiter.email,
      },
    });
  } catch (error) {
    console.error("Error fetching JD:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllFilteredResumes = async (req, res) => {
  const { jdId } = req.params;
  try {
    const jd = await JD.findById(jdId);
    if (!jd) {
      return res.status(404).json({ message: "JD not found" });
    }
    
    res.status(200).json({
      message: "Filtered resumes fetched successfully",
      filteredResumes: jd.filteredResumes || []
    });
  } catch (error) {
    console.error("Error fetching filtered resumes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFilteredResumesByJD = async (req, res) => {
  try {
    const { jdId } = req.params;
 
    if (!jdId) {
      return res.status(400).json({ error: "JD ID is required." });
    }
 
    const jd = await JD.findById(jdId);
 
    if (!jd) {
      return res.status(404).json({ error: "JD not found." });
    }
 
    const selectedFields = jd.filteredResumes.map(resume => ({
name: resume.name || "Unknown",
email: resume.email || "Not found",
      skills: resume.skills || [],
      fileName: resume.fileName || "N/A",
      matchSummary: resume.matchSummary || "No summary",
      matchPercentage: resume.matchPercentage || 0,
    }));
 
    res.status(200).json({
      jdId,
      count: selectedFields.length,
      filteredResumes: selectedFields,
    });
 
  } catch (error) {
    console.error("Error in getFilteredResumesByJD:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



