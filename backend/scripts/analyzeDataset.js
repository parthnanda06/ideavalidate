const fs = require("fs");
const path = require("path");

/**
 * Analyze the startup_ideas_5000 dataset
 */
function analyzeDataset() {
  const jsonFilePath = path.join(__dirname, "../data/startup_ideas_5000.json");

  if (!fs.existsSync(jsonFilePath)) {
    console.error("❌ JSON file not found. Run convertCSVtoJSON.js first.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));

  console.log("\n📈 STARTUP IDEAS DATASET ANALYSIS");
  console.log("=".repeat(60));

  // Basic statistics
  console.log(`\n📊 Basic Statistics:`);
  console.log(`Total Ideas: ${data.length}`);

  // Status distribution
  const statusDist = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n📌 Status Distribution:`);
  Object.entries(statusDist).forEach(([status, count]) => {
    const percentage = ((count / data.length) * 100).toFixed(2);
    console.log(`  ${status}: ${count} (${percentage}%)`);
  });

  // Industry distribution
  const industryDist = data.reduce((acc, item) => {
    acc[item.industry] = (acc[item.industry] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n🏭 Industry Distribution:`);
  Object.entries(industryDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([industry, count]) => {
      const percentage = ((count / data.length) * 100).toFixed(2);
      console.log(`  ${industry}: ${count} (${percentage}%)`);
    });

  // Feasibility distribution
  const feasibilityDist = data.reduce((acc, item) => {
    const feas = item.feasibility || "unknown";
    acc[feas] = (acc[feas] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n✅ Feasibility Distribution:`);
  Object.entries(feasibilityDist).forEach(([feas, count]) => {
    const percentage = ((count / data.length) * 100).toFixed(2);
    console.log(`  ${feas}: ${count} (${percentage}%)`);
  });

  // Sample ideas
  console.log(`\n🎯 Sample Ideas (First 5):`);
  data.slice(0, 5).forEach((item, idx) => {
    console.log(`\n  ${idx + 1}. ${item.description}`);
    console.log(
      `     Industry: ${item.industry} | Status: ${item.status} | Feasibility: ${item.feasibility}`,
    );
    console.log(`     Market: ${item.market_fit}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("✓ Analysis complete!");
}

// Run analysis
if (require.main === module) {
  analyzeDataset();
}

module.exports = { analyzeDataset };
