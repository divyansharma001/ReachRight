import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Using 1.5 Flash for better instruction following and speed
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Cold Email Generator API'
  });
});


app.post('/api/generate-email', async (req, res) => {
  try {
    // --- UPDATED DESTRUCTURING ---
    const { senderProfile, recipientName, emailGoal, recipientContext } = req.body;

    if (!senderProfile || !emailGoal) {
      return res.status(400).json({ error: 'Missing sender profile or email goal.' });
    }

    // --- REFINED & MORE DETAILED PROMPT ---
    const prompt = `
      You are "Grove," a world-class cold email strategist. Your task is to write a highly professional, concise, and personalized cold email that feels human and compels a response.

      **Output format MUST be a single, raw JSON object with two keys: "subject" and "body". Do NOT add any markdown like \`\`\`json, introductory text, or explanations.**

      ---
      **SENDER'S PROFILE:**
      - Name: ${senderProfile.name}
      - Title: ${senderProfile.title}
      - Company: ${senderProfile.company || 'Not provided (acting as an individual)'}
      - Website: ${senderProfile.website || 'Not provided'}
      - Unique Value Proposition (What they do): ${senderProfile.uvp}
      - About the sender: ${senderProfile.aboutYourself || 'Not provided'}
      - Scheduling Link (cal.com/calendly): ${senderProfile.calcom || 'Not provided'}
      - LinkedIn: ${senderProfile.linkedin || 'Not provided'}
      ---
      **RECIPIENT INFORMATION:**
      - Name: ${recipientName || 'Not provided'}
      - The Goal of this Email: "${emailGoal}"
      - Personalization Context (The key for the opening line): ${recipientContext || "No specific context provided. Infer the recipient's role and potential pain points from the 'Email Goal' to craft a relevant, but slightly more general, opening line."}
      ---
      **CRITICAL INSTRUCTIONS:**

      1.  **Subject Line ("subject"):**
          *   Create a short, intriguing, and professional subject (4-7 words).
          *   Avoid generic subjects like "Quick Question". Make it relevant to the personalization context if possible.
          *   Use lowercase, except for proper nouns. It feels more personal. Example: "your post on scaling engineering teams"

      2.  **Email Body ("body"):**
          *   **Greeting:** Start the 'body' with a greeting. 
              - If a 'recipientName' is provided, use it. Example: "Hi ${recipientName},"
              - If no name is provided, use a professional, neutral greeting like "Hi there,".
          *   **Formatting:** Use newline characters (\\n\\n) to create short, easy-to-read paragraphs. The entire body should be a single string in the JSON output.
          *   **Opening Line (1-2 sentences):** This is the MOST important part. Use the "Personalization Context" to write a genuine, specific opening line that shows you've done your research. It should NOT be about you (the sender).
          *   **Bridge & Value Prop (2-3 sentences):** Smoothly transition from your opening line to the sender's value proposition. Connect their achievement/interest to a problem you solve. Frame it as "I saw you did X, which is why I thought you might be interested in Y."
          *   **Call to Action (CTA - 1 sentence):** Create a clear, low-friction CTA.
              - If a scheduling link is available and the goal is a meeting, incorporate it naturally. Example: "Open to exploring this further? You can find a time on my calendar that works for you: ${senderProfile.calcom}"
              - If no link is available, ask a simple, interest-gauging question. Example: "Is improving developer onboarding a priority for you in Q3?"
          *   **Closing:** The 'body' MUST end before the signature. Do NOT include "Best regards,", the sender's name, or any contact info. This will be added by the application.
      ---
      
      Generate the JSON output now.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Improved JSON parsing to be more robust
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error("Could not find a valid JSON object in the AI response:", responseText);
        throw new Error("AI did not return a recognizable JSON object.");
    }
    
    const jsonString = jsonMatch[0];
    
    let emailContent;
    try {
        emailContent = JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Failed to parse the extracted JSON string:", jsonString);
        console.error("Original AI response was:", responseText);
        throw new Error("AI returned a malformed JSON object.");
    }

    res.status(200).json(emailContent);

  } catch (error) {
    console.error('Error in /api/generate-email:', error);
    res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
});

const cron = require('node-cron');
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Hourly render job starting...');
    await doRender();
    console.log('Done rendering');
  } catch (err) {
    console.error('Render job failed:', err);
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
