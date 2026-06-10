import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for retrying AI calls
async function generateWithRetry(modelName: string, prompt: string, schema: any, retries: number = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      return JSON.parse(response.text);
    } catch (error: any) {
      const isUnavailable = error.message?.includes("503") || error.message?.includes("UNAVAILABLE");
      if (i === retries) throw error;
      
      const waitTime = isUnavailable ? 5000 * (i + 1) : 2000 * (i + 1);
      console.warn(`AI Retry ${i+1}/${retries} after ${isUnavailable ? '503' : 'error'}:`, error.message);
      await new Promise(r => setTimeout(r, waitTime + Math.random() * 1000)); 
    }
  }
}

// Vision IA Endpoint: Strategic Synthesis
app.post("/api/ia/vision", async (req, res) => {
  try {
    const { productionData, maintenanceData, safetyData, prompt } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are the HydroMines Vision IA, a strategic brain for a mining subcontractor.
        Analyze the following data and answer the request:
        
        Production Data: ${JSON.stringify(productionData)}
        Maintenance Data: ${JSON.stringify(maintenanceData)}
        Safety Data: ${JSON.stringify(safetyData)}
        
        User Request: ${prompt}
        
        Provide professional, data-driven insights, identifying risks, anomalies, and optimization opportunities.
      `
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Vision IA Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Audit/Fraud Detection Endpoint
app.post("/api/ia/audit", async (req, res) => {
  try {
    const { contextData } = req.body;

    const schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        justification: { type: Type.STRING },
        flags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "justification"]
    };

    const prompt = `
        Analyze the following operational data for potential fraud, anomalies, or suspicious patterns in a mining context (e.g., fuel vs production mismatches, impossible entry speeds, frequent modifications).
        
        Data to Analyze: ${JSON.stringify(contextData)}
        
        Return a score from 0 to 100 (where 100 is highly suspicious) and a brief justification.
    `;

    const result = await generateWithRetry("gemini-3-flash-preview", prompt, schema);
    res.json(result);
  } catch (error: any) {
    console.error("IA Audit Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Assistant IA Endpoint: Improvement Suggestions
app.post("/api/ia/assistant", async (req, res) => {
  try {
    const { skillId, customPrompt, appContext } = req.body;
    
    let systemPrompt = "";
    if (skillId === 'metier') {
      systemPrompt = "Focus on mining operations excellence: safety, efficiency, equipment utilization, and drilling quality.";
    } else if (skillId === 'app') {
      systemPrompt = "Focus on application improvement: UI/UX, feature richness, performance, and user productivity.";
    } else {
      systemPrompt = "Provide a holistic improvement plan covering both technical and operational excellence.";
    }

    const schema = {
      type: Type.OBJECT,
      properties: {
        suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              description_fr: { type: Type.STRING },
              impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["category", "title", "description", "impact"]
          }
        }
      },
      required: ["suggestions"]
    };

    const prompt = `
        You are the HydroMines Strategy Expert.
        Application Context: ${appContext}
        Strategic Focus: ${systemPrompt}
        User specific request: ${customPrompt}
 
        Generate 4-5 structured and actionable improvement suggestions.
        Each suggestion must have: category, title, description, and impact (High/Medium/Low).
    `;

    const result = await generateWithRetry("gemini-3-flash-preview", prompt, schema);
    res.json(result);
  } catch (error: any) {
    console.error("Assistant IA Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Expert Panel Endpoint: Contextualized persona analysis
app.post("/api/ia/expert-analysis", async (req, res) => {
  try {
    const { expertName, profile, dataContext } = req.body;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING },
        anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        logic: { type: Type.STRING }
      },
      required: ["analysis", "anomalies", "suggestions", "logic"]
    };

    const prompt = `
        You are ${expertName}, a top-tier world expert with the following profile: ${profile}.
        Your goal is to analyze the following mining operational data for HydroMines:
        
        Data: ${JSON.stringify(dataContext)}
        
        Provide your professional analysis in French. 
        Focus on:
        1. Anomalies related to your expertise.
        2. Concrete suggestions for optimization.
        3. The underlying logic/framework you used for this analysis.
        
        Format your response as a JSON object.
    `;

    const result = await generateWithRetry("gemini-3-flash-preview", prompt, schema);
    res.json(result);
  } catch (error: any) {
    console.error(`Expert Analysis Error:`, error);
    res.status(500).json({ error: error.message });
  }
});


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler for JSON responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ 
      error: err.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
  });
}

startServer();
