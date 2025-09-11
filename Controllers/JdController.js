import JD from "../Models/JdSchema.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import pdfParse from "pdf-parse";
import { extractCandidateDetails } from "../utils/extractCandidateDetails.js";
import Candidate from "../Models/Candidate.js";
import axios from "axios";
import CandidateRegister from "../Models/CandidateRegister.js";
import CandidateAddition from "../Models/CandidateAdditiondetails.js";
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
    company,
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
- company: ${company}
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
6. How to Apply: [Click here to apply]-> (http://localhost:5173/CandidateRegister)

Do not include recruiter email in the JD.


Use markdown formatting and bullet points.
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
      company,
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

export const updateJd = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullJD } = req.body;
    if (!fullJD) {
      return res.status(400).json({ message: "fullJD is required" });
    }

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User info missing." });
    }

    const jd = await JD.findOne({ _id: id, recruiter: req.user._id });
    if (!jd) {
      return res
        .status(404)
        .json({
          message: "JD not found or you don't have permission to update it.",
        });
    }

    jd.fullJD = fullJD;
    await jd.save();
    res.status(200).json({ message: "JD updated successfully", jd });
  } catch (error) {
    console.error("Error updating JD:", error);
    res.status(500).json({ message: "Internal server error" });
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

    // 🔹 Fetch JD once (to check duplicates in filtered resumes)
    const jd = await JD.findById(jdId);
    if (!jd) return res.status(404).json({ error: "JD not found." });

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
        skills,
        experience,
        resumeText: pdfText,
      };

      // ✅ Only check duplicates in FILTERED resumes for this JD
      if (matchPercentage >= 60 && email) {
        const alreadyFiltered = jd.filteredResumes.some(
          (r) => r.email === email
        );

        if (!alreadyFiltered) {
          await Candidate.create({
            name,
            email,
            skills,
            experience,
            score: matchPercentage,
            jdId,
            testSent: false,
          });

          filteredResults.push(resumeData);
          jd.filteredResumes.push(resumeData); // add to JD
        } else {
          console.log(`⏭ Skipped duplicate filtered resume: ${email}`);
        }
      } else {
        unfilteredResults.push(resumeData);
        jd.unfilteredResumes.push(resumeData); // always save unfiltered
      }

      fs.unlinkSync(filePath); // delete uploaded file after processing
    }

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

//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const filteredResults = [];
//     const unfilteredResults = [];

//     for (const file of files) {
//       const filePath = file.path;
//       const pdfBuffer = fs.readFileSync(filePath);
//       const pdfText = (await pdfParse(pdfBuffer)).text;

//        const prompt = `
// You are a resume filtering assistant. Compare this resume against the job description and provide:

// 1. Match percentage (0-100)
// 2. Brief reason for the score
// 3. Whether candidate qualifies (Good Fit: Yes/No)

// FILTERING RULES:
// - 70%+ = Good candidate (gets filtered in)
// - Focus on required skills and experience
// - Consider education requirements
// - Be concise in explanation

// Job Description:
// ${jdText}

// Resume:
// ${pdfText}

// Format your response as:
// Match: [X]%
// Reason: [Brief explanation]
// Good Fit: [Yes/No]
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

// export const filterCloudinaryJD = async (req, res) => {
//   try {
//     const { jdId, jdText } = req.body;

//     if (!jdId || !jdText) {
//       return res.status(400).json({ error: "jdId and jdText are required." });
//     }

//     const jd = await JD.findById(jdId).populate("applications.candidate");
//     if (!jd) return res.status(404).json({ error: "JD not found." });

//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//     // 🔍 Get resumes from JD applications instead of CandidateAddition
//     const resumes = jd.applications;

//     const filteredResults = [];
//     const unfilteredResults = [];

//     for (const application of resumes) {
//       const resumeUrl = application.resume;
//       const fileName = resumeUrl.split("/").pop().split("?")[0];

//       try {
//         // 🔽 Download resume from Cloudinary
//         const response = await axios.get(resumeUrl, {
//           responseType: "arraybuffer",
//         });
//         const pdfBuffer = Buffer.from(response.data, "binary");

//         // 🧠 Extract text from PDF
//         const pdfText = (await pdfParse(pdfBuffer)).text;

//         // 🧠 Prompt Gemini
//         const prompt = `
// Compare the following resume with this job description. Give:
 
// 1. A match percentage (out of 100)
// 2. Key matching skills
// 3. Whether the candidate is a good fit (Yes/No)
 
// ### Job Description:
// ${jdText}
 
// ### Resume:
// ${pdfText}
//         `;

//         const result = await model.generateContent(prompt);
//         const matchSummary =
//           result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
//           "No summary available";

//         const match = matchSummary.match(/(\d+)%/);
//         const matchPercentage = match ? parseInt(match[1]) : 0;

//         // ✂️ Extract candidate details
//         const { name, email, skills, experience } =
//           extractCandidateDetails(pdfText);

//         const resumeData = {
//           fileName,
//           matchSummary,
//           matchPercentage,
//           name: name || "Unknown",
//           email: email || "Not found",
//           skills,
//           experience,
//           resumeText: pdfText,
//         };

//         // ✅ Store to filtered if score >= 60 and not duplicate
//         if (matchPercentage >= 60 && email) {
//           const isDuplicate = jd.filteredResumes.some((r) => r.email === email);

//           if (!isDuplicate) {
//             // Store candidate summary (optional)
//             await Candidate.create({
//               name,
//               email,
//               skills,
//               experience,
//               score: matchPercentage,
//               jdId,
//               testSent: false,
//             });

//             filteredResults.push(resumeData);
//             jd.filteredResumes.push(resumeData);
//           }
//           else {
//             console.log(`⏭ Skipped duplicate filtered resume: ${email}`);
//           }
//         } else {
//           unfilteredResults.push(resumeData);
//           jd.unfilteredResumes.push(resumeData);
//         }
//       } catch (err) {
//         console.warn(
//           `⚠️ Failed to process resume from ${resumeUrl}:`,
//           err.message
//         );
//         continue;
//       }
//     }

//     await jd.save();

//     res.status(200).json({
//       message: "Resumes filtered and candidates stored.",
//       savedFiltered: filteredResults.length,
//       savedUnfiltered: unfilteredResults.length,
//       filtered: filteredResults,
//       unfiltered: unfilteredResults,
//     });
//   } catch (error) {
//     console.error("❌ Error in filterJD:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

export const filterCloudinaryJD = async (req, res) => {
  try {
    const { jdId, jdText } = req.body;
 
    if (!jdId || !jdText) {
      return res.status(400).json({ error: "jdId and jdText are required." });
    }
 
    const jd = await JD.findById(jdId).populate("applications.candidate");
    if (!jd) return res.status(404).json({ error: "JD not found." });
 
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
 
    const filteredResults = [];
    const unfilteredResults = [];
    let shortlistedCount = 0;
    let rejectedCount = 0;
 
    // 🔍 Loop through JD applications
    for (const app of jd.applications) {
      try {
        const resumeUrl = app.resume;
        const fileName = resumeUrl.split("/").pop().split("?")[0];
 
        // 🔽 Download resume
        const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
        const pdfBuffer = Buffer.from(response.data, "binary");
 
        // 🧠 Extract text
        const pdfText = (await pdfParse(pdfBuffer)).text;
 
        // 🧠 Prompt Gemini
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
 
        // ✂️ Extract candidate details
        const { name, email, skills, experience } = extractCandidateDetails(pdfText);
 
        const resumeData = {
          fileName,
          matchSummary,
          matchPercentage,
          name: name || "Unknown",
          email: email || "Not found",
          skills,
          experience,
          resumeText: pdfText,
        };
 
        // ✅ Check duplicates across both arrays
const alreadyFiltered = jd.filteredResumes.some((r) => r.email === email);
const alreadyUnfiltered = jd.unfilteredResumes.some((r) => r.email === email);
 
        if (matchPercentage >= 60 && email) {
          if (!alreadyFiltered) {
            await Candidate.create({
              name,
              email,
              skills,
              experience,
              score: matchPercentage,
              jdId,
              testSent: false,
            });
 
            jd.filteredResumes.push(resumeData);
            filteredResults.push(resumeData);
          } else {
            console.log(`⏭ Skipped duplicate filtered resume: ${email}`);
          }
 
          if (app.status === "pending") {
            app.status = "shortlisted";
            shortlistedCount++;
          }
        } else {
          if (!alreadyUnfiltered) {
            jd.unfilteredResumes.push(resumeData);
            unfilteredResults.push(resumeData);
          } else {
            console.log(`⏭ Skipped duplicate unfiltered resume: ${email}`);
          }
 
          if (app.status === "pending") {
            app.status = "rejected";
            rejectedCount++;
          }
        }
      } catch (err) {
        console.warn(
          `⚠️ Failed to process resume for candidate ${app.candidate?._id}:`,
          err.message
        );
        continue;
      }
    }
 
    await jd.save();
 
    res.status(200).json({
      message: "Resumes filtered, statuses updated, and candidates stored.",
      savedFiltered: filteredResults.length,
      savedUnfiltered: unfilteredResults.length,
      shortlisted: shortlistedCount,
      rejected: rejectedCount,
      filtered: filteredResults,
      unfiltered: unfilteredResults,
      applications: jd.applications.map((a) => ({
        candidate: a.candidate?.name,
        email: a.candidate?.email,
        status: a.status,
      })),
    });
  } catch (error) {
    console.error("❌ Error in filterAndUpdateJD:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(400).json({
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

// export const filterCloudinaryJDhard = async (req, res) => {
//   try {
//     const { jdId, jdText } = req.body;
 
//     if (!jdId || !jdText) {
//       return res.status(400).json({ error: "jdId and jdText are required." });
//     }
 
//     const jd = await JD.findById(jdId).populate("applications.candidate");
//     if (!jd) return res.status(404).json({ error: "JD not found." });
 
//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
 
//     const filteredResults = [];
//     const unfilteredResults = [];
//     let shortlistedCount = 0;
//     let rejectedCount = 0;
 
//     // 🔍 Loop through JD applications instead of CandidateAddition
//     for (const app of jd.applications) {
//       try {
//         const resumeUrl = app.resume;
//         const fileName = resumeUrl.split("/").pop().split("?")[0];
 
//         // 🔽 Download resume
//         const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
//         const pdfBuffer = Buffer.from(response.data, "binary");
 
//         // 🧠 Extract text
//         const pdfText = (await pdfParse(pdfBuffer)).text;
 
//         // 🧠 Prompt Gemini
//         const prompt = `
// Compare the following resume with this job description. Give:
// 1. A match percentage (out of 100)
// 2. Key matching skills
// 3. Whether the candidate is a good fit (Yes/No)
 
// ### Job Description:
// ${jdText}
 
// ### Resume:
// ${pdfText}
//         `;
 
//         const result = await model.generateContent(prompt);
//         const matchSummary =
//           result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
//           "No summary available";
 
//         const match = matchSummary.match(/(\d+)%/);
//         const matchPercentage = match ? parseInt(match[1]) : 0;
 
//         // ✂️ Extract candidate details
//         const { name, email, skills, experience } = extractCandidateDetails(pdfText);
 
//         const resumeData = {
//           fileName,
//           matchSummary,
//           matchPercentage,
//           name: name || "Unknown",
//           email: email || "Not found",
//           skills,
//           experience,
//           resumeText: pdfText,
//         };
 
//         // ✅ If score >= 60 → shortlisted
//         if (matchPercentage >= 60 && email) {
// const isDuplicate = jd.filteredResumes.some((r) => r.email === email);
 
//           if (!isDuplicate) {
//             await Candidate.create({
//               name,
//               email,
//               skills,
//               experience,
//               score: matchPercentage,
//               jdId,
//               testSent: false,
//             });
 
//             jd.filteredResumes.push(resumeData);
//             filteredResults.push(resumeData);
//           }
 
//           if (app.status === "pending") {
//             app.status = "shortlisted";
//             shortlistedCount++;
//           }
//         } else {
//           // ❌ Else → rejected
//           jd.unfilteredResumes.push(resumeData);
//           unfilteredResults.push(resumeData);
 
//           if (app.status === "pending") {
//             app.status = "rejected";
//             rejectedCount++;
//           }
//         }
//       } catch (err) {
//         console.warn(`⚠️ Failed to process resume for candidate ${app.candidate?._id}:`, err.message);
//         continue;
//       }
//     }
 
//     await jd.save();
 
//     res.status(200).json({
//       message: "Resumes filtered, statuses updated, and candidates stored.",
//       savedFiltered: filteredResults.length,
//       savedUnfiltered: unfilteredResults.length,
//       shortlisted: shortlistedCount,
//       rejected: rejectedCount,
//       filtered: filteredResults,
//       unfiltered: unfilteredResults,
//       applications: jd.applications.map((a) => ({
//         candidate: a.candidate?.name,
//         email: a.candidate?.email,
//         status: a.status,
//       })),
//     });
//   } catch (error) {
//     console.error("❌ Error in filterAndUpdateJD:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

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
      filteredResumes: jd.filteredResumes || [],
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

    const selectedFields = jd.filteredResumes.map((resume) => ({
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

export const getAllJdByRecruiter = async (req, res) => {
  try {
    const jds = await JD.find({ recruiter: req.user._id })
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: "All JDs fetched successfully",
      jds: jds.map((jd) => ({
        _id: jd._id,
        title: jd.title,
        jobSummary: jd.jobSummary,
        createdAt: jd.createdAt,
        recruiter: {
          name: jd.recruiter.name,
          email: jd.recruiter.email,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching JDs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRecentFilteredResumes = async (req, res) => {
  try {
    const jds = await JD.find({ recruiter: req.user._id })
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });

    const allResumes = jds.flatMap((jd) =>
      jd.filteredResumes.map((resume) => ({
        ...resume.toObject(),
        jdId: jd._id,
        jdTitle: jd.title || "untitled jd",
      }))
    );
    const recentFilteredResumes = allResumes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    res.status(200).json({
      message: "All recent filtered resumes fetched successfully",
      recentFilteredResumes: recentFilteredResumes.map((resume) => ({
        _id: resume._id,
        name: resume.name || "Unknown",
        email: resume.email || "Not found",
        jdId: resume.jdId || "Not found",
        jdTitle: resume.jdTitle || "Not found",
      })),
    });
  } catch (error) {
    console.error("Error fetching recent filtered resumes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const getFilteredCandidateByEmail = async (req, res) => {
//   const { email } = req.body;

//   try {
//     if (!email) {
//       return res.status(400).json({ message: "Email is required." });
//     }
//     const jds = await JD.find({ "filteredResumes.email": email });

//     const filteredResumesHard = jds.flatMap(jd =>
//       jd.filteredResumes.filter(resume => resume.email === email)
//     );

//     if (filteredResumesHard.length === 0) {
//       return res.status(404).json({ message: "No resumes found for the given email." ,
//          filteredResumes: filteredResumesHard.map(resume => ({
//         _id: resume._id,
//         name: resume.name || "Unknown",
//         email: resume.email || "Not found",

//       }))
//       });
//     }

//     res.status(200).json({
//       message: "Email found successfully!",
//       filteredResumes: filteredResumesHard.map(resume => ({
//         _id: resume._id,
//         name: resume.name || "Unknown",
//         email: resume.email || "Not found",

//       }))

//     });
//   } catch (error) {
//     console.error("Error fetching filtered resumes:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const getRecentFiveJdAndItsFilteredResumesAndUnfilteredResumesCount =
  async (req, res) => {
    try {
      const jds = await JD.find({ recruiter: req.user._id })

        .populate("recruiter", "name email")
        .sort({ createdAt: -1 })
        .limit(5);
      const result = await Promise.all(
        jds.map(async (jd) => {
          const filteredCount = jd.filteredResumes.length;
          const unfilteredCount = jd.unfilteredResumes.length;
          return {
            jdId: jd._id,
            jdTitle: jd.title,
            filteredResumesCount: filteredCount,
            unfilteredResumesCount: unfilteredCount,
          };
        })
      );

      res.status(200).json({
        message: "Recent 5 JDs and their resumes count fetched successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching recent JDs and resumes count:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const getCountOfTotalJdsAndTotalResumes = async (req, res) => {
  try {
    const totalJds = await JD.countDocuments({ recruiter: req.user._id });
    const totalFilteredApplicants = await JD.aggregate([
      { $match: { recruiter: req.user._id } },
      { $unwind: "$filteredResumes" },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const totalUnfilteredApplicants = await JD.aggregate([
      { $match: { recruiter: req.user._id } },
      { $unwind: "$unfilteredResumes" },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const totalApplicants =
      totalFilteredApplicants[0]?.count + totalUnfilteredApplicants[0]?.count;

    res.status(200).json({
      message: "Total JDs and applicants count fetched successfully",
      data: {
        totalJds,
        // totalFilteredApplicants: totalFilteredApplicants[0]?.count || 0,
        // totalUnfilteredApplicants: totalUnfilteredApplicants[0]?.count || 0,
        totalApplicants,
      },
    });
  } catch (error) {
    console.error("Error fetching total JDs and applicants count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFilteredCandidateByEmail = async (req, res) => {
  const { email, jdId } = req.body;

  try {
    if (!email || !jdId) {
      return res.status(400).json({ message: "Email and JD ID are required." });
    }

    const jd = await JD.findById(jdId);
    if (!jd) {
      return res.status(404).json({ message: "Job description not found." });
    }

    const filteredResumes = jd.filteredResumes.filter(
      (resume) => resume.email === email
    );
    if (filteredResumes.length === 0) {
      return res
        .status(404)
        .json({ message: "No resumes found for the given email in this JD." });
    }

    res.status(200).json({
      message: "Filtered resumes found successfully!",
      filteredResumes: filteredResumes.map((resume) => ({
        _id: resume._id,
        name: resume.name || "Unknown",
        email: resume.email || "Not found",
      })),
    });
  } catch (error) {
    console.error("Error fetching filtered resumes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCandidatesdataAccordingToJD = async (req, res) => {
  const { jobId } = req.params;
  try {
    const candidates = await CandidateAddition.find({ jobId })
      .sort({ createdAt: -1 })
      .populate("candidateId", "name email");
    res.status(200).json({
      message: "Candidates fetched successfully",
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateCandidateStatuses = async (req, res) => {
  try {
    const { jdId } = req.body;
 
    if (!jdId) {
      return res.status(400).json({ error: "jdId is required." });
    }
 
    const jd = await JD.findById(jdId).populate("applications.candidate");
    if (!jd) return res.status(404).json({ error: "JD not found." });
 
    let shortlistedCount = 0;
    let rejectedCount = 0;
 
    // 🔹 Mark filtered resumes as shortlisted
    for (const resume of jd.filteredResumes) {
if (resume.email) {
        const app = jd.applications.find(
(a) => a.candidate?.email === resume.email
        );
        if (app && app.status === "pending") {
          app.status = "shortlisted";
          shortlistedCount++;
        }
      }
    }
 
    // 🔹 Mark unfiltered resumes as rejected
    for (const resume of jd.unfilteredResumes) {
if (resume.email) {
        const app = jd.applications.find(
(a) => a.candidate?.email === resume.email
        );
        if (app && app.status === "pending") {
          app.status = "rejected";
          rejectedCount++;
        }
      }
    }
 
    await jd.save();
 
    res.status(200).json({
      message: "Candidate statuses updated successfully.",
      shortlisted: shortlistedCount,
      rejected: rejectedCount,
      applications: jd.applications.map((a) => ({
        candidate: a.candidate?.name,
        email: a.candidate?.email,
        status: a.status,
      })),
    });
  } catch (error) {
    console.error("❌ Error in updateCandidateStatuses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
