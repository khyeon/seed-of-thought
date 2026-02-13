const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        // Try gemini-pro which is very common
        console.log('Testing gemini-pro...');
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("hello");
        const response = await result.response;
        console.log('Success (gemini-pro):', response.text());
    } catch (error) {
        console.log('Error (gemini-pro):', error.message);

        try {
            console.log('Testing gemini-1.0-pro...');
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result2 = await model2.generateContent("hello");
            const response2 = await result2.response;
            console.log('Success (gemini-1.0-pro):', response2.text());
        } catch (error2) {
            console.log('Error (gemini-1.0-pro):', error2.message);
        }
    }
}

test();
