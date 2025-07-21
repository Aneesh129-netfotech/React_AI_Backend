import JD from '../Models/JdSchema.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import axios from 'axios';
dotenv.config();
 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 
export const generateJD = async (req, res) => {
  const {
    title,
    experience,
    skills,
    location,
    company,
    employmentType,
    salaryRange
  } = req.body;
 
if (!req.user || !req.user.email || !req.user._id) {
    return res.status(401).json({ message: 'Unauthorized: User info missing.' });
  }
 
const recruiterEmail = req.user.email;
 
  const prompt = `
Write a professional job description using the following:
 
- Job Title: ${title}
- Required Experience: ${experience} years
- Skills: ${skills.join(', ')}
- Location: ${location}
- Company: ${company}
- Employment Type: ${employmentType}
${salaryRange ? `- Salary Range: ${salaryRange}` : ""}
 
Include:
1. Company Overview
2. Job Summary
3. Key Responsibilities
4. Required Skills
5. Preferred Skills
6. Perks & Benefits
7. How to Apply (Email: ${recruiterEmail})
Use markdown formatting and bullet points.
`;
 
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jdText = response.text();
 
    const newJD = await JD.create({
      recruiter: req.user._id,
      title,
      experience,
      skills,
      location,
      company,
      employmentType,
      salaryRange,
      fullJD: jdText,
    });
 
    res.status(201).json({
      message: 'JD generated and saved using Gemini successfully.',
      jd: newJD,
    });
  } catch (err) {
    console.error('Gemini JD Generation Error:', err?.message || err);
    res.status(500).json({ message: 'Gemini JD generation failed.' });
  }
};
 
//   try {
//     const jdText = req.body;
//     const files = req.files;
 
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const results = [];
 
//     for (const file of files) {
//       const filePath = file.path // ✅ Use correct path
 
//       const pdfBuffer = fs.readFileSync(filePath);
//       const pdfText = (await pdfParse(pdfBuffer)).text;
 
//       const prompt = `
// Compare this resume to the job description and give a match percentage and brief explanation.
 
// Job Description:
// ${jdText}
 
// Resume:
// ${pdfText}
// `;
 
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const matchSummary = await response.text();
 
//       results.push({
//         fileName: file.originalname,
//         matchSummary,
//       });
 
//       fs.unlinkSync(filePath); // ✅ Clean up
//     }
 
//     res.json({ results });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };
 

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 
export const filterJD = async (req, res) => {
  try {
    const jdText = req.body.jdText;
    const files = req.files;
 
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No resumes uploaded.' });
    }
 
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const results = [];
 
    for (const file of files) {
      const filePath = file.path;
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfText = (await pdfParse(pdfBuffer)).text;
 
      const prompt = `
Compare the following resume with this job description.
Give:
1. A match percentage (out of 100)
2. Key matching skills
3. Whether the candidate is a good fit (Yes/No)
 
### Job Description:
${jdText}
 
### Resume:
${pdfText}
`;
 
      const result = await model.generateContent(prompt);
      const matchSummary = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available';
 
      results.push({
        fileName: file.originalname,
        matchSummary,
      });
 
      fs.unlinkSync(filePath); 
    }
 
    res.status(200).json({ results });
 
  } catch (error) {
    console.error('Error in filterJd:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};