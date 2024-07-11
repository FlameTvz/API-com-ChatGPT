import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(filePath) {
    try {
        console.log(`Transcrevendo o arquivo: ${filePath}`); // Log para verificar o caminho do arquivo na transcrição
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
        });
        console.log(`Texto transcrito: ${transcription.text}`); // Log para verificar o texto transcrito
        return transcription.text;
        
    } catch (error) {
        console.error('Erro ao transcrever o áudio:', error);
        throw error;
    }
}

