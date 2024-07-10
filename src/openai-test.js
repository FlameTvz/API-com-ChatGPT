import express from "express";
import OpenAI from "openai";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from 'url';
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { transcribeAudio } from './transcription.js'; // Importa a função do módulo transcription.js

// Inicializa o express e outras configurações
const app = express();
app.use(express.json());
app.use(cors());

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
        console.log(`Arquivo salvo em: ${latestFilePath}`); // Log para verificar o caminho do arquivo
        cb(null, filePath);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('audio'), (req, res) => {
    console.log(`Recebido arquivo: ${req.file.originalname}`); // Log para verificar o upload
    res.json({ filePath: latestFilePath });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(4006, () => {
    console.log('Servidor rodando na porta 4006');
});

app.post('/transcribe', async (req, res) => {
    if (latestFilePath) {
        try {
            const transcriptionText = await transcribeAudio(latestFilePath);
            console.log(`Transcrição: ${transcriptionText}`); // Log para verificar a transcrição

            // Chama a função de pergunta com o texto da transcrição
            await pergunta(transcriptionText);

            res.json({ transcription: transcriptionText });
        } catch (error) {
            console.error('Erro ao transcrever o áudio:', error);
            res.status(500).send('Erro ao transcrever o áudio.');
        }
    } else {
        res.status(400).send('Nenhum arquivo foi carregado ainda.');
    }
});

async function pergunta(transcriptionText) {
    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: transcriptionText }
        ],
        model: "gpt-3.5-turbo",
    });

    console.log(`Resposta: ${completion.choices[0].message.content}`);
}
