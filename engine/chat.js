require("dotenv").config({ quiet: true });
const { Groq } = require('groq-sdk');

async function chat(query) {
    try {
        // Get the model
        const groq = new Groq({
            apiKey: process.env.GROQ_KEY
        });


        // Generate content
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    role: "system",
                    content: `
                    You are a helpful and concise assistant.
                    Talk like a friendly human. Be as friendly and engaging as possible.
                    Do not mention you are an AI model.
                    Don't use emojis, symbols, or special characters. Just plain text.
                    Keep your answers brief and to the point.
                    Remember, you are talking to a human user, so keep it short.
                    I know you want to be helpful, but please keep your response as short as possible.
                    `
                },
                {
                    "role": "user",
                    "content": query || ""
                }
            ],
            "model": "openai/gpt-oss-20b",
            "temperature": 1,
            "max_completion_tokens": 8192,
            "top_p": 1,
            "stream": true,
            "reasoning_effort": "medium",
            "stop": null
        });

        let fullResponse = "";

        for await (const chunk of chatCompletion) {
            process.stdout.write(chunk.choices[0]?.delta?.content || '');
            fullResponse += chunk.choices[0]?.delta?.content || '';
        }

        //  Process the response
        fullResponse = fullResponse.replace(/[\*\-]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g, '').trim();

        return {
            response: fullResponse
        };

    } catch (error) {
        console.error("Error calling Groq API:", error);
        throw error;
    }
}

module.exports = {
    chat
};

