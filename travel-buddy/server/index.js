import 'dotenv/config';
import express from 'express';
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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});