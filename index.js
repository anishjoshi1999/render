const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const { searchGoogleMaps } = require("./scrapeGoogleMaps");

const importedData = require("./data");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Importing Routes

// Connection to Database

const MONGODB_URI = `${process.env.MONGODB_URI}`;

mongoose.set("strictQuery", false);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

// Routes
app.get("/", async (req, res) => {
  res.send("For Freelancer Project");
});
app.get("/scrape", async (req, res) => {
  for (let i = 0; i < importedData.length; i++) {
    await searchGoogleMaps(
      `Pharmacy and Chemisty in ${importedData[i].Name}, ${importedData[i].State},Australia`,
      `${importedData[i].State}`
    );
    console.log(`${i + 1} Scraping Completed`);
  }
  console.log("Scraping Finished");
});
