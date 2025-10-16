import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { uploadDetectionToIPFS, fetchDetectionFromIPFS, pinToIPFS, generateContentHash, type AIDetectionMetadata } from "./ipfs";
import { getVerificationFromChain, getUserVerifications, isContentVerified, getVerificationFee } from "./blockchain";

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

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

      const openai = getOpenAIClient();
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

  // Prepare detection data for IPFS storage
  app.post("/api/detection/prepare-storage", async (req, res) => {
    try {
      const { content, detectionResult, detectionType, userAddress } = req.body;
      
      if (!content || !detectionResult || !userAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate content hash
      const contentHash = generateContentHash(content);

      // Check if already verified
      const alreadyVerified = await isContentVerified(contentHash);
      if (alreadyVerified) {
        const existing = await getVerificationFromChain(contentHash);
        return res.json({
          success: true,
          alreadyVerified: true,
          verification: existing,
          message: "This content has already been verified on-chain"
        });
      }

      // Prepare metadata for IPFS
      const metadata: AIDetectionMetadata = {
        contentHash,
        contentType: detectionType || 'text',
        detectionResult: {
          isAuthentic: detectionResult.probability < 50,
          confidenceScore: detectionResult.probability,
          aiProbability: detectionResult.probability,
          label: detectionResult.label
        },
        detectionDetails: {
          modelUsed: detectionResult.modelUsed || "AI Detection Model",
          processingTime: Date.now(),
          timestamp: Date.now()
        },
        userInfo: {
          walletAddress: userAddress
        },
        imageAnalysis: detectionResult.imageInfo,
        originalContent: {
          snippet: content.substring(0, 200),
          size: content.length,
          format: detectionType || 'text'
        }
      };

      // Upload to IPFS
      const ipfsCid = await uploadDetectionToIPFS(metadata);
      await pinToIPFS(ipfsCid);

      res.json({
        success: true,
        contentHash,
        ipfsCid,
        detection: metadata.detectionResult,
        ipfsUrl: `https://ipfs.io/ipfs/${ipfsCid}`,
        message: "Detection data stored on IPFS. Ready for blockchain verification."
      });

    } catch (error: any) {
      console.error("Error in prepare-storage:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get verification from blockchain
  app.get("/api/verification/:contentHash", async (req, res) => {
    try {
      const { contentHash } = req.params;
      
      const verification = await getVerificationFromChain(contentHash);
      
      if (!verification) {
        return res.status(404).json({ error: "Verification not found" });
      }

      // Fetch full data from IPFS
      let ipfsData = null;
      try {
        ipfsData = await fetchDetectionFromIPFS(verification.ipfsCid);
      } catch (error) {
        console.error("Failed to fetch IPFS data:", error);
      }

      res.json({
        success: true,
        verification,
        ipfsData,
        ipfsUrl: `https://ipfs.io/ipfs/${verification.ipfsCid}`,
        basescanUrl: `https://sepolia.basescan.org/tx/${verification.contentHash}`
      });

    } catch (error: any) {
      console.error("Error fetching verification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's verification history
  app.get("/api/user/:address/verifications", async (req, res) => {
    try {
      const { address } = req.params;
      
      const verifications = await getUserVerifications(address);
      
      res.json({
        success: true,
        count: verifications.length,
        verifications
      });

    } catch (error: any) {
      console.error("Error fetching user verifications:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get current verification fee
  app.get("/api/verification-fee", async (req, res) => {
    try {
      const fee = await getVerificationFee();
      res.json({
        success: true,
        fee,
        feeInWei: "0" // Since it's 0 by default
      });
    } catch (error: any) {
      console.error("Error fetching verification fee:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
