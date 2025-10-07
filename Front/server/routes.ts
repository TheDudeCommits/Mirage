import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // OpenAI pre-analysis endpoint for text detection
  app.post("/api/openai/analyze-text", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const prompt = `Analyze the text below, do a quick web search for it. ONLY if you find an exact match, determine whether it's Human-Written (e.g. US Constitution, Research Article, Reddit thread, etc.) or AI-Generated and return ONLY the corresponding label; Human-Written or AI-Generated.
IF you do not find an exact match, just return the label, Not Found.
No extra explanations, JUST THE LABEL.

Text to analyze:
${text}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0,
      });

      const result = response.choices[0]?.message?.content?.trim();
      
      // Validate the response
      const validResponses = ["Human-Written", "AI-Generated", "Not Found"];
      const classification = validResponses.find(valid => 
        result?.includes(valid)
      ) || "Not Found";

      res.json({ classification });
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ error: "Failed to analyze text with OpenAI" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
