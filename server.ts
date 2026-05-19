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
      `,
      config: {
      }
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
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the following operational data for potential fraud, anomalies, or suspicious patterns in a mining context (e.g., fuel vs production mismatches, impossible entry speeds, frequent modifications).
        
        Data to Analyze: ${JSON.stringify(contextData)}
        
        Return a score from 0 to 100 (where 100 is highly suspicious) and a brief justification.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            justification: { type: Type.STRING },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "justification"]
        }
      }
    });

    res.json(JSON.parse(response.text));
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are the HydroMines Strategy Expert.
        Application Context: ${appContext}
        Strategic Focus: ${systemPrompt}
        User specific request: ${customPrompt}

        Generate 4-5 structured and actionable improvement suggestions.
        Each suggestion must have: category, title, description, and impact (High/Medium/Low).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
                  impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["category", "title", "description", "impact"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Assistant IA Error:", error);
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
}

startServer();
