const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY NOT FOUND");
  process.exit(1);
}

// REST call to list models
async function list() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  data.models.filter(m => m.supportedGenerationMethods.includes("generateContent")).forEach(m => {
    console.log(m.name);
  });
}

list();
