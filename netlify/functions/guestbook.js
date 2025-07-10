const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

//  Rate limit: One entry per IP every 60 seconds
const RATE_LIMIT_SECONDS = 10;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ip = event.headers["x-forwarded-for"] || "unknown";
  const { name, message } = JSON.parse(event.body || "{}");

  // Input validation
  if (
    !name || !message ||
    name.length > 50 || message.length > 500 ||
    /<[^>]*>/.test(name) || /<[^>]*>/.test(message)
  ) {
    return {
      statusCode: 400,
      body: "Invalid name or message",
    };
  }

  // Rate limiting by IP
  const { data: recentEntries, error: rateError } = await supabase
    .from("guestbook")
    .select("timestamp")
    .eq("ip", ip)
    .order("timestamp", { ascending: false })
    .limit(1);

  if (rateError) {
    return { statusCode: 500, body: "Rate check failed" };
  }

  if (recentEntries.length > 0) {
    const lastTime = new Date(recentEntries[0].timestamp).getTime();
    const now = Date.now();
    const diffSec = (now - lastTime) / 1000;
    if (diffSec < RATE_LIMIT_SECONDS) {
      return {
        statusCode: 429,
        body: `You're posting too fast. Try again in ${Math.ceil(RATE_LIMIT_SECONDS - diffSec)} seconds.`,
      };
    }
  }

  const { error } = await supabase.from("guestbook").insert([
    {
      name,
      message,
      timestamp: new Date().toISOString(),
      ip,
    },
  ]);

  if (error) {
    return {
      statusCode: 500,
      body: "Error saving entry: " + error.message,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};