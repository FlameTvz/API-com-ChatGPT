
import fs from "fs";
import path from "path";
import OpenAI from "openai";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});



export async function speechIA(){
    
    const mp3 = await openai.audio.speech.create({

        model: "tts=1",
        voice: "alloy",
        input: transcription,
    });
    console.log(speechFile);
    const buffer = Buffer.from( await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

}


