export const extractCandidateDetails = (resumeText) => {
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = resumeText.match(/Name[:\-]?\s*(.*)/i);
 
  const name = nameMatch ? nameMatch[1].split("\n")[0].trim() : "Unknown";
  const email = emailMatch ? emailMatch[0] : null;
 
  return { name, email };
};