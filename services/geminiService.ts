
import { GoogleGenAI } from "@google/genai";
import { Player, HandRank } from "../types";
import { evaluateHand } from "../utils/pokerLogic";

export const generateCommentary = async (
  players: Player[],
  lastAction: string,
  winner?: Player
): Promise<string> => {
  let apiKey: string | undefined;
  
  try {
    // Extremely defensive check for process.env
    if (typeof process !== 'undefined') {
       // @ts-ignore
       if (process && process.env && process.env.API_KEY) {
         // @ts-ignore
         apiKey = process.env.API_KEY;
       }
    }
  } catch (e) {
    // Ignore errors if process is not defined or restricted
  }

  if (!apiKey) {
    return "";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
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
        maxOutputTokens: 60,
      }
    });

    return response.text || "";
  } catch (error) {
    // console.warn("Gemini API Error (Non-fatal):", error);
    return "";
  }
};
