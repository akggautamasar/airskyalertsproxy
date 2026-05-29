const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const CAPCOM_USER = process.env.CAPCOM_USER || 'MPPQBX';
const CAPCOM_PASS = process.env.CAPCOM_PASS || 'n_-uczscbbqtjc';
const TG_TOKEN   = process.env.TG_TOKEN || '';
const PORT       = process.env.PORT || 8000;

app.get('/', (req, res) => res.json({ status: 'ok', service: 'SkyAlert Proxy' }));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/sms', async (req, res) => {
  const { phones, message } = req.body;
  if (!phones || !message) return res.status(400).json({ ok: false, error: 'phones and message required' });
  try {
    const r = await axios.post('https://api.sms-gate.app/3rdparty/v1/message',
      { message, phoneNumbers: phones },
      { auth: { username: CAPCOM_USER, password: CAPCOM_PASS }, timeout: 15000 }
    );
    console.log('✅ SMS sent to', phones);
    res.json({ ok: true, data: r.data });
  } catch (e) {
    console.error('❌ SMS error:', e.response?.data || e.message);
    res.status(500).json({ ok: false, error: e.response?.data || e.message });
  }
});

app.post('/telegram', async (req, res) => {
  const { chat_id, message } = req.body;
  const token = req.headers['x-tg-token'] || TG_TOKEN;
  if (!token || !chat_id || !message) return res.status(400).json({ ok: false, error: 'Missing fields' });
  try {
    const r = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id, text: message, parse_mode: 'HTML' }, { timeout: 10000 }
    );
    res.json({ ok: true, data: r.data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.response?.data || e.message });
  }
});

app.listen(PORT, () => console.log(`🌩️ SkyAlert Proxy on port ${PORT}`));
