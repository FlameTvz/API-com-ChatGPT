import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import { transcribeAudio } from './transcription.js';
import initDB from './database.js'; // Importa a função do módulo database.js

const app = express();
app.use(express.json());
app.use(cors());

let transcription2 = ''; 

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let latestFilePath = '';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const filePath = Date.now() + '-' + file.originalname;
        latestFilePath = path.join('uploads', filePath);
        console.log(`Arquivo salvo em: ${latestFilePath}`);
        cb(null, filePath);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('audio'), (req, res) => {
    console.log(`Recebido arquivo: ${req.file.originalname}`);
    res.json({ filePath: latestFilePath });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/transcribe', async (req, res) => {
    if (latestFilePath) {
        try {
            const transcriptionText = await transcribeAudio(latestFilePath);
            console.log(`Transcrição: ${transcriptionText}`);

            // Chama a função de pergunta com o texto da transcrição
            const gptResponse = await pergunta(transcriptionText);

            // Gera o áudio e envia a URL do arquivo MP3 gerado
            await speechIA();
            res.json({ audioUrl: '/get-audio' });
        } catch (error) {
            console.error('Erro ao transcrever o áudio:', error);
            res.status(500).json({ error: 'Erro ao transcrever o áudio.' });
        }
    } else {
        res.status(400).json({ error: 'Nenhum arquivo foi carregado ainda.' });
    }
});

const speechFile = path.resolve("./speech.mp3");

async function pergunta(transcriptionText) {
    const db = await initDB();
    const rows = await db.all('SELECT info FROM building_info');
    const systemInfo = rows.map(row => row.info).join(' ');

    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: systemInfo },
            { role: "user", content: transcriptionText }
        ],
        model: "gpt-3.5-turbo",
    });

    console.log(`Resposta: ${completion.choices[0].message.content}`);
    transcription2 = completion.choices[0].message.content;

    return transcription2; // Retorna a resposta do GPT
}

async function speechIA() {
    const mp3 = await openai.audio.speech.create({
        model: "tts-1", // Substitua pelo ID correto do modelo de TTS
        voice: "alloy",
        input: transcription2,
    });

    console.log(speechFile);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    console.log(`Áudio gerado salvo em: ${speechFile}`);
}

app.get('/get-audio', (req, res) => {
    res.sendFile(speechFile);
});

app.listen(4006, () => {
    console.log('Servidor rodando na porta 4006');
});
