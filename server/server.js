// Filename: server/server.js

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
  model: "gemini-2.0-flash",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

app.post('/api/generate-email', async (req, res) => {
  try {
    const { senderProfile, recipientInfo, recipientContext } = req.body;

    if (!senderProfile || !recipientInfo) {
      return res.status(400).json({ error: 'Missing sender profile or recipient info.' });
    }

    const prompt = `
      You are "Grove," a world-class cold email strategist. Your task is to write a highly professional, concise, and personalized cold email that feels human and compels a response.

      **Output format MUST be a single, raw JSON object with two keys: "subject" and "body". Do NOT add any markdown like \`\`\`json, introductory text, or explanations.**

      **Sender's Profile:**
      - Name: ${senderProfile.name}
      - Title: ${senderProfile.title}
      - Company: ${senderProfile.company || 'Not provided (acting as an individual)'}
      - Website: ${senderProfile.website || 'Not provided'}
      - Unique Value Proposition (What they do): ${senderProfile.uvp}
      - About the sender: ${senderProfile.aboutYourself || 'Not provided'}
      - **Available Links:**
        - LinkedIn: ${senderProfile.linkedin || 'Not provided'}
        - Scheduling Link (cal.com/calendly): ${senderProfile.calcom || 'Not provided'}

      **Recipient's Goal (what the sender wants to achieve):**
      "${recipientInfo}"

      **Recipient's Context (for hyper-personalization, if provided):**
      ${recipientContext || "No additional context provided. Infer the recipient's role and potential pain points from the 'Recipient's Goal' to craft a relevant opening."}

      **CRITICAL INSTRUCTIONS:**
      1.  **Subject Line (subject):** Create a short, intriguing, and professional subject (4-7 words).
      2.  **Email Body (body):**
          *   **DO NOT** include a greeting like "Hi [Recipient's Name],". The body must start directly with the opening line.
          *   **Personalized Opener (1-2 sentences):** This is the most important part. Use the "Recipient's Context" to craft a genuine, specific opening line. If no context is provided, make an intelligent guess based on their likely role from the 'Recipient Goal'.
          *   **Bridge & Value Prop (2-3 sentences):** Connect your opener to the sender's value prop. Frame it as a solution to the recipient's likely problem.
          *   **Call to Action (CTA - 1 sentence):** This is where you will use the sender's links intelligently.
              - If the goal is a demo, partnership, or call, and a scheduling link is available, naturally incorporate it into the CTA. Example: "If this aligns with your priorities, feel free to book a brief chat on my calendar: ${senderProfile.calcom}"
              - If the goal is more about networking or introduction, and a LinkedIn profile is available, you might suggest connecting there. Example: "My work is focused on [topic], which you can see more of on my LinkedIn. Open to connecting?"
              - If no link is relevant or available, use a simple, interest-gauging question. Example: "Is improving developer onboarding a priority for you right now?"
          *   **Tone & Style:** Confident, respectful, concise, and human. Use short paragraphs. Avoid buzzwords.
          *   **Closing:** The 'body' MUST end before the signature. Do NOT include "Best regards," or the sender's name.

      Generate the JSON output now.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.error("Could not find a valid JSON object in the AI response:", responseText);
        throw new Error("AI did not return a recognizable JSON object.");
    }

    const jsonString = responseText.substring(startIndex, endIndex + 1);
    
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

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});