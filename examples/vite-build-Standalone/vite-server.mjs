import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import portfinder from "portfinder";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Define rate limiting rules
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests from this IP, please try again later.",
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// Serve static files from node_modules within examples/vite-build-standalone
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Use portfinder to get an available port
const defaultPort = process.env.PORT || 3000;
portfinder.basePort = defaultPort;

portfinder.getPort((err, port) => {
  if (err) {
    console.error(err);
    return;
  }

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
});
