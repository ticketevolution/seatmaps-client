const express = require("express");
const path = require("path");
const portfinder = require("portfinder");

const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

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
