import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is missing in server/.env file');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = 'gemini-3.5-flash-lite';

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World Ganteng !");
});

app.post('/generate-text', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    res.status(200).json({ result: response.text });
  } catch (error) {
    console.log(process.env.GEMINI_API_KEY);
    console.error('Error generating text:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

app.post('/generate-from-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const { prompt } = req.body;
    const base64File = req.file.buffer.toString("base64");
    const response = await ai.models.generateContent({
      model: model,
      contents:
        [
          { text: prompt ?? "Make me a summary of this file" },
          {
            inlineData: {
              data: base64File,
              mimeType: req.file.mimetype,
            }
          }
        ],
    });
    res.status(200).json({ result: response.text });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
})

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) {
      return res.status(400).json({ error: "Conversation must be an array" });
    }
    const result = await ai.models.generateContent({
      model: model,
      contents: conversation,
      config: {
        temperature: 0.8,
        systemInstruction: "Anda adalah Travel Buddy, AI Assistant perjalanan cerdas dari platform liburan mirip Traveloka. Anda membantu pengguna merencanakan itinerary liburan, menemukan destinasi wisata populer, rekomendasi hotel, kuliner lokal, tips penerbangan, serta perkiraan anggaran. Berikan jawaban yang ramah, sangat membantu, ringkas namun jelas, dan gunakan format Markdown yang rapi dengan poin-poin serta cetak tebal. Selalu jawab dalam bahasa Indonesia."
      },
    });

    return res.status(200).json({ result: result.text });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to generate text" });
  }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});