import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Python backend integration for analyzing resumes and interests
  app.post("/api/analyze-profile", (req, res) => {
    const { profileData } = req.body;
    // Here we would typically proxy this to the Python backend
    // For now, we mock the response
    console.log("Analyzing profile with Python backend:", profileData);
    
    // Mock analysis result
    setTimeout(() => {
      res.json({
        success: true,
        recommendedProjects: [
          { id: 1, matchScore: 95, reason: "Strong Oracle DBA experience" },
          { id: 2, matchScore: 82, reason: "Relevant cloud migration background" }
        ]
      });
    }, 1000);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
