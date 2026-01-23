const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

/**
 * Convert startup_ideas_5000.csv to JSON format compatible with mlService
 */
function convertCSVtoJSON() {
  const csvFilePath = path.join(__dirname, "../data/startup_ideas_5000.csv");
  const jsonFilePath = path.join(__dirname, "../data/startup_ideas_5000.json");

  const results = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      // Transform CSV data to match mlService expected format
      const item = {
        description: row.idea_text || "",
        industry: row.domain || "Technology",
        market_fit: `${row.demand} demand, ${row.competition} competition`,
        feasibility: row.feasibility === "Yes" ? "high" : "low",
        // Determine status based on feasibility and competition
        status:
          row.feasibility === "Yes" && row.competition !== "High"
            ? "success"
            : "moderate",
      };
      results.push(item);
    })
    .on("end", () => {
      // Save as JSON
      fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
      console.log(`✓ Converted ${results.length} records from CSV to JSON`);
      console.log(`✓ Saved to: ${jsonFilePath}`);

      // Summary statistics
      const successCount = results.filter((r) => r.status === "success").length;
      const moderateCount = results.filter(
        (r) => r.status === "moderate",
      ).length;
      const industries = [...new Set(results.map((r) => r.industry))];

      console.log("\n📊 Dataset Summary:");
      console.log(`Total ideas: ${results.length}`);
      console.log(`Success potential: ${successCount}`);
      console.log(`Moderate potential: ${moderateCount}`);
      console.log(`Industries: ${industries.join(", ")}`);
    })
    .on("error", (error) => {
      console.error("Error reading CSV:", error);
    });
}

// Run conversion
if (require.main === module) {
  convertCSVtoJSON();
}

module.exports = { convertCSVtoJSON };
