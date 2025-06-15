import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Loads .env file contents into process.env
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

// --- Gemini AI Setup ---
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


// --- API Endpoint ---
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

      **Recipient's Goal (what the sender wants to achieve):**
      "${recipientInfo}"

      **Recipient's Context (for hyper-personalization, if provided):**
      ${recipientContext || "No additional context provided. Infer the recipient's role and potential pain points from the 'Recipient's Goal' to craft a relevant opening."}

      **CRITICAL INSTRUCTIONS:**
      1.  **Subject Line (subject):** Create a short, intriguing, and professional subject (4-7 words). It must not sound like a template. If recipient context is given, hint at it. Example: "Idea for Acme's marketing" or "re: your post on data strategies".
      2.  **Email Body (body):**
          *   **Greeting:** Start with "Hi [Recipient's Name],". The app will handle replacing the placeholder.
          *   **Personalized Opener (1-2 sentences):** This is KEY. If "Recipient's Context" is available, use it to craft a genuine observation. Show you've done your research. Example: "I saw your recent comment on LinkedIn about the challenges of scaling data pipelines, and it struck a chord." If no context, make an intelligent guess based on their likely role from the 'Recipient Goal'. Example: "As a leader in fintech, you're likely always evaluating new security protocols."
          *   **Bridge & Value Prop (2-3 sentences):** Connect your opener to the sender's value prop. Don't just state what the sender does; frame it as a solution to the recipient's likely problem. Example: "That's why I thought you'd be interested in how we help CTOs like you cut down on integration time by 40%."
          *   **Clear, Low-Friction CTA (1 sentence):** End with a simple, interest-gauging question. Avoid demanding a meeting. Good: "Is improving developer onboarding a priority for you right now?" Bad: "Are you free for a 15-minute call on Tuesday?".
          *   **Tone:** Confident, respectful, concise, and human. Use short paragraphs. Avoid buzzwords and hype.
          *   **Closing:** The 'body' MUST end before the signature. Do NOT include "Best regards," or the sender's name.

      Generate the JSON output now.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // --- FIX: Robust JSON parsing ---
    // This block finds the JSON object within the AI's response,
    // even if it's surrounded by markdown or other text.
    
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
    // --- End of Fix ---

    res.status(200).json(emailContent);

  } catch (error) {
    console.error('Error in /api/generate-email:', error);
    res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});