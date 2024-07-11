import express from "express";
import OpenAI from "openai";
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

app.post('/transcribe', async (req, res) => {
    if (latestFilePath) {
        try {
            const transcriptionText = await transcribeAudio(latestFilePath);
            console.log(`Transcrição: ${transcriptionText}`); // Log para verificar a transcrição

            // Chama a função de pergunta com o texto da transcrição
            const gptResponse = await pergunta(transcriptionText);

            res.json({ transcription: transcriptionText, gptResponse });
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
    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "Você é um porteiro virtual que só responde coisas do prédio que você está, o nome do prédio é: Caminho de Luxo, ele tem 20 andares com cada andar contendo 4 apartamentos" },
            { role: "user", content: transcriptionText }
        ],
        model: "gpt-3.5-turbo",
    });

    console.log(`Resposta: ${completion.choices[0].message.content}`);
    transcription2 = completion.choices[0].message.content;

    // Verifica se transcription2 não está vazio antes de chamar speechIA
    if (transcription2 && transcription2.trim().length > 0) {
        await speechIA();
    } else {
        console.error('Erro: A resposta do GPT está vazia ou muito curta.');
    }

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

app.post('/get-audio', (req, res) => {
    res.sendFile(speechFile);
});

app.listen(4006, () => {
    console.log('Servidor rodando na porta 4006');
});
