// app.js
// Import required modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dataFilePath = path.join(__dirname, 'data.json');

const readData = () => {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
  }
  const data = fs.readFileSync(dataFilePath);
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// Users array updated as required
const users = [
  { username: 'admin', password: 'admin123', role: 'manager', employeeNumber: 'E001', department: 'Development' },
  { username: 'user1', password: 'user123', role: 'developer', employeeNumber: 'E002', department: 'Development' },
  { username: 'user2', password: 'user123', role: 'sales', employeeNumber: 'E003', department: 'Sales' },
];

/////////////////////////////
// Endpoints
/////////////////////////////

// 1. Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// 2. Current time endpoint (German time)
app.get('/current-time', async (req, res) => {
  try {
    const response = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Europe/Berlin');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching time' });
  }
});

// 3. Update attendance endpoint
// If "checkin" is provided, create a new record; if "checkout" is provided, update the latest record if its checkout is empty, otherwise create a new record.
app.post('/update-time', (req, res) => {
  const { username, checkin, checkout } = req.body;
  const data = readData();
  if (checkin) {
    const record = {
      id: Date.now(),
      username,
      checkin,
      checkout: null
    };
    data.push(record);
    writeData(data);
    res.json({ success: true, record });
  } else if (checkout) {
    const userRecords = data.filter(r => r.username === username);
    if (userRecords.length > 0) {
      const latestRecord = userRecords.reduce((prev, curr) => (prev.id > curr.id ? prev : curr));
      if (!latestRecord.checkout || latestRecord.checkout === "") {
        latestRecord.checkout = checkout;
        writeData(data);
        res.json({ success: true, record: latestRecord });
      } else {
        const record = {
          id: Date.now(),
          username,
          checkin: "",
          checkout
        };
        data.push(record);
        writeData(data);
        res.json({ success: true, record });
      }
    } else {
      const record = {
        id: Date.now(),
        username,
        checkin: "",
        checkout
      };
      data.push(record);
      writeData(data);
      res.json({ success: true, record });
    }
  } else {
    res.status(400).json({ success: false, message: 'No valid data provided' });
  }
});

// 4. Get records endpoint
app.get('/records', (req, res) => {
  const data = readData();
  res.json(data);
});

// 5. Update record endpoint (for admin editing)
app.put('/records/:id', (req, res) => {
  const { id } = req.params;
  const updatedRecord = req.body;
  let data = readData();
  const index = data.findIndex(record => record.id == id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updatedRecord };
    writeData(data);
    res.json({ success: true, record: data[index] });
  } else {
    res.status(404).json({ success: false, message: 'Record not found' });
  }
});

// 6. Delete record endpoint
app.delete('/records/:id', (req, res) => {
  let data = readData();
  const index = data.findIndex(record => record.id == req.params.id);
  if (index !== -1) {
    const removedRecord = data.splice(index, 1)[0];
    writeData(data);
    res.json({ success: true, record: removedRecord });
  } else {
    res.status(404).json({ success: false, message: 'Record not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
