import { getModel } from '../config/aiConfig.js';

// A simple in-memory store for conversation history
const conversationHistory = new Map<string, any[]>();

/**
 * Manages the conversation history for a given user.
 * @param userId The ID of the user.
 * @param newUserMessage The new message from the user.
 * @returns The updated conversation history.
 */
const manageHistory = (userId: string, newUserMessage: string) => {
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }

    const userHistory = conversationHistory.get(userId)!;

    // Add the new user message
    userHistory.push({ role: 'user', parts: [{ text: newUserMessage }] });

    // Trim the history to keep it within a reasonable size
    if (userHistory.length > 10) {
        conversationHistory.set(userId, userHistory.slice(-10));
    }

    return userHistory;
};

/**
 * Interacts with the AI model to get a response.
 * @param userId The ID of the user.
 * @param message The message from the user.
 * @returns The AI's response.
 */
export const chatWithAI = async (userId: string, message: string) => {
    try {
        const model = getModel();
        const history = manageHistory(userId, message);

        const chat = model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 200,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        // Add the model's response to the history
        history.push({ role: 'model', parts: [{ text }] });

        return { success: true, message: text };
    } catch (error) {
        console.error('AI Chat Error:', error);
        return { success: false, message: 'Sorry, I encountered an error.' };
    }
};
