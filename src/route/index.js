const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const routesDir = path.join(__dirname, "..");

fs.readdirSync(routesDir).forEach((file) => {
  const routePath = path.join(routesDir, file, "route.js");

  if (fs.existsSync(routePath)) {
    try {
      const route = require(routePath);
      // ✅ safer check for router
      if (route && typeof route === "function" &&  route.name === "router") {
        router.use(`/${file}`, route);
        console.log(`✅ Loaded route: /${file}`);
      } else {
        console.log(`⚠️ Skipped ${file}: not a valid router`);
      }
    } catch (err) {
      console.error(`❌ Error loading ${file}: ${err.message}`);
    }
  }
});

module.exports = router;