 const extractCandidateDetails = (resumeText) => {
  const lines = resumeText.split('\n').map(line => line.trim()).filter(Boolean);
 
  // Extract email
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;
 
  // Name extraction
  let name = "Unknown";
  const nameRegex = /Name[:\-]?\s*(.+)/i;
  const nameLine = lines.find(line => nameRegex.test(line));
  if (nameLine) {
    name = nameLine.match(nameRegex)[1];
  } else if (lines.length > 0 && lines[0].length < 40) {
    name = lines[0];
  }
 
  // ✅ Skills Extraction (improved)
  let skills = [];
  const skillSectionIndex = lines.findIndex(line =>
    /skills|technical skills|skill set/i.test(line)
  );
 
  if (skillSectionIndex !== -1) {
    // Search in the next 3–5 lines after the "Skills" header
    const skillBlock = lines.slice(skillSectionIndex, skillSectionIndex + 5).join(' ');
    skills = skillBlock
      .split(/[,•\u2022\n\t]+/)
      .map(s => s.trim())
      .filter(s =>
        s.length > 1 &&
        !/^(skills|technical skills|skill set)$/i.test(s)
      );
  }
 
  // If no skills found yet, try to look for lines with > 2 tech terms
  if (skills.length === 0) {
    const likelySkillLines = lines.filter(line =>
      (line.match(/[,•\u2022]/g) || []).length >= 2
    );
    const joined = likelySkillLines.join(', ');
    skills = joined
      .split(/[,•\u2022\n\t]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1);
  }

  console.log("skills", skills);
  
 
  // ✅ Experience Extraction
  const expMatch = resumeText.match(/(\d+)\+?\s*(years|yrs)/i);
  const experience = expMatch ? parseInt(expMatch[1]) : null;
 
  return { name, email, skills, experience };
};

export default extractCandidateDetails;