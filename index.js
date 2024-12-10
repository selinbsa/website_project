const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const fetch = require("node-fetch");
const { default: axios } = require("axios");

const app = express();
const port = 3000;

const dataFilePath = path.join(__dirname, "products.json");

const getGoldPrice = async () => {
  try {
    const response = await axios.get("https://api.gold-api.com/price/XAU");
    const data = response.data; // No need to parse JSON, it's already parsed by axios

    if (data && data.price) {
      const goldPricePerGram = data.price / 31.1035; // Convert ounce to gram
      return goldPricePerGram;
    }

    throw new Error("Invalid API response: price not found");
  } catch (error) {
    console.error("Error fetching gold price:", error.message);
    return 0; // Return 0 as a fallback value
  }
};

const calculatePrice = (popularityScore, weight, goldPrice) => {
  return (popularityScore + 1) * weight * goldPrice;
};

app.get("/rings", async (req, res) => {
  try {
    const jsonData = await fs.readFile(dataFilePath, "utf-8");
    const rings = JSON.parse(jsonData);

    const goldPrice = await getGoldPrice();

    const ringsWithPrices = rings.map((ring) => ({
      ...ring,
      price: calculatePrice(
        ring.popularityScore,
        ring.weight,
        goldPrice
      ).toFixed(2),
    }));

    res.json(ringsWithPrices);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Unable to fetch rings data. ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
