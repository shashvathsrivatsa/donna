//  INIT
require("dotenv").config({ quiet: true });
const express = require('express');
const app = express();

const { get_module_name } = require("./engine/interpreter.js");
const { chat } = require("./engine/chat.js");
const { tts } = require("./engine/tts.js");

const { calendar_render } = require("./modules/calendar/calendar_render.js");

const { fs } = require("fs");
const { InferenceClient } = require("@huggingface/inference");


app.use(express.json());


//  PING
app.get('/', (req, res) => {
    res.status(200).send("Server is on");
});


// ===============================  ENGINE  =============================== //

//  INTERPRETER
app.post('/interpreter', async (req, res) => {
    try {
        console.log("");
        const query = req.body.query;
        const state = req.body.state;
        console.log('interpret query:', query);

        const interpreter_result = await get_module_name(query, state);
        res.status(200).json(interpreter_result);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing the interpreter request.' });
    }
});


//  CHAT
app.post('/chat', async (req, res) => {
    try {
        console.log("");
        const query = req.body.query;
        console.log('chat query:', query);

        const chat_result = await chat(query);
        res.status(200).json(chat_result);
    } catch (error) {
        console.log("Error in /chat endpoint:", error);
        res.status(500).json({ error: 'An error occurred while processing the chat request.' });
    }
});


//  TTS
app.post('/tts', async (req, res) => {
    try {
        return res.status(400).json({ error: "Cooling server" });

        const text = req.body.text;
        const client = new InferenceClient(process.env.HF_TOKEN);

        const audio = await tts(text);
        const buffer = Buffer.from(await audio.arrayBuffer());

        res.setHeader("Content-Type", "audio/wav");
        res.send(buffer);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "TTS failed" });
    }
});


// ===============================  MODULES  =============================== //

//  CALENDAR RENDER
app.post('/calendar/render', async (req, res) => {
    try {
        const start = Date.now();

        const { calendar_render } = require("./modules/calendar/calendar_render.js");
        const imageBuffer = await calendar_render();

        const end = Date.now();
        console.log(`Calendar rendered in ${end - start} ms`);

        res.setHeader("Content-Type", "image/png");
        res.send(imageBuffer);

    } catch (error) {
        console.error("Error in /calendar/render endpoint:", error);
        res.status(500).json({ error: 'An error occurred while rendering the calendar.' });
    }
});



//  START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


