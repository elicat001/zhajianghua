
import { GoogleGenAI } from "@google/genai";
import { Player, HandRank } from "../types";
import { evaluateHand } from "../utils/pokerLogic";

export const generateCommentary = async (
  players: Player[],
  lastAction: string,
  winner?: Player
): Promise<string> => {
  try {
    // Initialize with API key from process.env directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    // Summarize game state for the AI
    const activePlayers = players.filter(p => p.status === 'Playing' || p.status === 'Won');
    
    // Privacy: Only reveal Bot cards or Winner cards to the AI
    const playerStates = activePlayers.map(p => {
        let handDesc = "Hidden";
        // Only evaluate hand if it has cards
        if ((p.isBot || p.status === 'Won' || p.hasSeenCards) && p.hand && p.hand.length === 3) {
            try {
                const h = evaluateHand(p.hand);
                handDesc = `${h.name} (${p.hand.map(c => c.label+c.suit).join(',')})`;
            } catch (e) {
                handDesc = "Unknown Hand";
            }
        }
        return `${p.name} (${p.chips} chips): ${handDesc}. Status: ${p.status}`;
    }).join('\n');

    let prompt = `You are a cynical, funny, and high-energy commentator for a "Zha Jin Hua" (Chinese Poker) game.
    
    Current Game Situation:
    ${playerStates}
    
    Last Action: ${lastAction}
    ${winner ? `Winner: ${winner.name} won the pot!` : ''}

    Generate a ONE SENTENCE simplified Chinese or English commentary (mix is okay, Hong Kong movie style is great) about this situation. Be brief.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.9,
        // Disable thinking for lower latency in commentary tasks
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "";
  } catch (error) {
    // console.warn("Gemini API Error (Non-fatal):", error);
    return "";
  }
};