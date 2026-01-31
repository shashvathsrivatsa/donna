require("dotenv").config({ quiet: true });
const { Groq } = require('groq-sdk');

async function get_module_name(query, state) {
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
                    You will receive a single user message.
                    Your job is to decide which category it belongs to.

                    Choose one of the following and respond with only the word.
                    - calendar_render: if the user want's to see or update the calendar
                    - weather: anything about weather or forecasts
                    - chat: general conversation or questions
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
            // process.stdout.write(chunk.choices[0]?.delta?.content || '');
            fullResponse += chunk.choices[0]?.delta?.content || '';
        }

        console.log(fullResponse);
        module_name = fullResponse;

        // Get parameters
        let parameters = "";

        if (module_name == "chat") {
            parameters = query;
        }

        return {
            module_name: module_name,
            parameters: parameters
        };

    } catch (error) {
        console.error("Error calling Groq API:", error);
        throw error;
    }
}

module.exports = {
    get_module_name
};
