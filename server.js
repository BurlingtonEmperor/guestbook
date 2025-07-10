const express = require('express');
const path = require('path');
const { Low, JSONFile } = require('lowdb');
const app = express();

// Setup DB
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data ||= { messages: [] };
  await db.write();
}

initDB();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Get messages
app.get('/messages', async (req, res) => {
  await db.read();
  res.json(db.data.messages);
});

// Post message
app.post('/messages', async (req, res) => {
  const { name, message } = req.body;
  if (name && message) {
    db.data.messages.push({ name, message, time: new Date().toISOString() });
    await db.write();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Missing name or message" });
  }
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});