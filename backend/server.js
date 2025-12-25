require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // allow frontend to access API

// Correct platform detection using CLIST resource name
function detectPlatform(c) {
  const platform = c.resource?.name?.toLowerCase() || "";
  const event = c.event.toLowerCase();

  if (platform.includes("codeforces") && event.includes("div. 3")) return "Codeforces";
  if (platform.includes("leetcode") && (event.includes("weekly") || event.includes("biweekly"))) return "LeetCode";
  if (platform.includes("codechef") && event.includes("starter")) return "CodeChef";
  if (platform.includes("atcoder") && event.includes("beginner")) return "AtCoder";
  return "Other";
}

// Get upcoming contests
app.get("/api/contests", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v2/contest/?upcoming=true&format=json&limit=100";

    const response = await axios.get(url, {
      headers: {
        Authorization: `ApiKey ${process.env.CLIST_USER}:${process.env.CLIST_KEY}`,
        "User-Agent": "contest-tracker"
      }
    });

    const contests = response.data.objects;

    const filtered = contests.filter(c => detectPlatform(c) !== "Other");

    // Sort by start time
    filtered.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Map contests and convert UTC -> IST
    const contestsWithIST = filtered.map(c => {
      const utcDate = new Date(c.start);
      const istOffset = 5.5 * 60; // 5 hours 30 min
      const istDate = new Date(utcDate.getTime() + istOffset * 60 * 1000);

      return {
        id: c.id,
        event: c.event,
        start: istDate.toISOString(),
        href: c.href,
        platform: detectPlatform(c)
      };
    });

    res.json(contestsWithIST);
  } catch (error) {
    console.error(
      "❌ CLIST ERROR:",
      error.response?.status,
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
