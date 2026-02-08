//  INIT
require("dotenv").config({ quiet: true });

const { InferenceClient } = require("@huggingface/inference");
const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();
app.use(express.json());


const { get_module_name } = require("./engine/interpreter.js");
const { chat } = require("./engine/chat.js");
const { tts } = require("./engine/tts.js");

const { calendar_render } = require("./modules/calendar/calendar_render.js");
const { getCalendarEvents } = require("./modules/calendar/calendar_render_helper.js");

const { sendEmail } = require("./utils/sendEmail.js");





//  PING
app.get('/', (req, res) => {
    res.status(200).send("Server is on");
});








// ==============================================================  ENGINE  ============================================================== //

//  INTERPRETER
app.post('/engine/interpreter', async (req, res) => {
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
app.post('/engine/chat', async (req, res) => {
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
app.post('/engine/tts', async (req, res) => {
    try {
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







// ==============================================================  MODULES  ============================================================== //

//  CALENDAR RENDER
app.post('/modules/calendar/render', async (req, res) => {
    try {
        const start = Date.now();

        const events = await getCalendarEvents();
        fs.writeFileSync(path.join(__dirname, 'cache', 'CalendarEventsCache.json'), JSON.stringify(events, null, 2));

        const imageBuffer = await calendar_render(events);

        const end = Date.now();
        console.log(`Calendar rendered in ${end - start} ms`);

        res.setHeader("Content-Type", "image/png");
        res.send(imageBuffer);

    } catch (error) {
        console.error("Error in /calendar/render endpoint:", error);
        res.status(500).json({ error: 'An error occurred while rendering the calendar.' });
    }
});







// ==============================================================  WEBHOOKS  ============================================================== //

//  CALENDAR UPDATE
app.post("/webhooks/google-calendar", async (req, res) => {
    try {
        const events = await getCalendarEvents();

        //  get cached events
        const cachedEventsPath = path.join(__dirname, 'cache', 'CalendarEventsCache.json');
        let cachedEvents = [];
        if (fs.existsSync(cachedEventsPath)) {
            const cachedData = fs.readFileSync(cachedEventsPath);
            cachedEvents = JSON.parse(cachedData);
        }

        if (JSON.stringify(events) !== JSON.stringify(cachedEvents)) {
            fs.writeFileSync(cachedEventsPath, JSON.stringify(events, null, 2));
            await sendEmail();
            console.log("Calendar updated - email sent.");
        } else {
            console.log("No changes in calendar events.");
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Error in /webhooks/google-calendar endpoint:", error);
        res.status(500).json({ error: 'An error occurred while processing the calendar update webhook.' });
    }
});


//  START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


