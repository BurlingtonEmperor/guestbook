const form = document.getElementById('guest-form');
const messagesList = document.getElementById('messages');

const loadMessages = async () => {
  const res = await fetch('/messages');
  const messages = await res.json();

  messagesList.innerHTML = '';
  messages.forEach(m => {
    const li = document.createElement('li');
  
    li.textContent = `${m.name}: ${m.message}`;
    messagesList.appendChild(li);
  });
};

form.onsubmit = async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;

  await fetch('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, message })
  });

  form.reset();
  loadMessages();
};

loadMessages();