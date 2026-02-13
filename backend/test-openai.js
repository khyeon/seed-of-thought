const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hello' }],
        });
        console.log('Success:', response.choices[0].message.content);
    } catch (error) {
        console.log('Error Type:', error.type);
        console.log('Error Message:', error.message);
        if (error.response) {
            console.log('Status:', error.status);
            console.log('Headers:', error.headers);
        }
    }
}

test();
