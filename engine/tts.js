require("dotenv").config({ quiet: true });
const { InferenceClient } = require("@huggingface/inference");
const fs = require("fs");

const client = new InferenceClient(process.env.HF_TOKEN);

async function tts(text) {
    console.log("\n\nGenerating TTS for text");
    const audio = await client.textToSpeech({
        provider: "replicate",
        model: "hexgrad/Kokoro-82M",
        inputs: text,
    });
    console.log("Audio generation complete.");

    // fs.writeFileSync("output.wav", Buffer.from(await audio.arrayBuffer()));
    // console.log("Audio saved as output.wav");
    return(audio);
};
// tts("It sounds like a pretty strong storm. It’s probably bringing heavy snow and slick roads, so it’s a good idea to stay inside if you can and keep your car ready with blankets and a full tank. Stay warm and safe!");


module.exports = {
    tts
};

