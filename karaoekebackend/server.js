// const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const express = require('express');
const app = express();

// Middleware to handle CORS
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin); // Allow requests from the matched origin
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allow these HTTP methods
  res.header('Access-Control-Allow-Headers', 'Content-Type'); // Allow these headers

  // If it's a preflight request, respond with a 200 status
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json()); // This is required to parse JSON bodies

// Your routes go here

app.listen(4000, () => {
  console.log('Server running on port 4000');
});


const server = http.createServer(app);
const io = new Server(server);

mongoose.connect('mongodb+srv://dompagtalunan:mGaXATyGXm24fE0w@baropskaraoke.zbjth.mongodb.net/?retryWrites=true&w=majority&appName=baropskaraoke', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const songRequestSchema = new mongoose.Schema({
  song: String,
  songRequester: String,
  url: String,
  timeRequested: { type: Date, default: Date.now },
  order: Number, // to track the order of song requests
});

const SongRequest = mongoose.model('SongRequest', songRequestSchema);

app.get('/songRequests', async (req, res) => {
  const songRequests = await SongRequest.find().sort({ order: 1 }); // fetch song requests sorted by order
  res.json(songRequests);
});

app.post('/songRequests', async (req, res) => {
  try {
    const { song, songRequester, url } = req.body;
    
    if (!song || !songRequester || !url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const requestCount = await SongRequest.countDocuments();
    const newSongRequest = new SongRequest({
      song,
      songRequester,
      url,
      order: requestCount,
      timeRequested: new Date() // Automatically set timeRequested
    });

    await newSongRequest.save();
    io.emit('itemsUpdated');
    res.status(201).json(newSongRequest);

  } catch (error) {
    console.error('Error creating song request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/songRequests/:id', async (req, res) => {
  await SongRequest.findByIdAndDelete(req.params.id);
  await adjustOrdersAfterDeletion(); // Adjust order after a song request is deleted
  io.emit('itemsUpdated');
  res.status(204).send();
});

app.put('/songRequests/reorder', async (req, res) => {
  const { reorderedItems } = req.body;

  try {
    // Get the current state of song requests from the database
    const currentRequests = await SongRequest.find().sort({ order: 1 });

    // Map the current song requests to a dictionary for quick lookup
    const currentRequestsMap = {};
    currentRequests.forEach((request) => {
      currentRequestsMap[request._id] = request;
    });

    // Resolve conflicts by adjusting orders
    for (const { _id, order } of reorderedItems) {
      if (currentRequestsMap[_id] && currentRequestsMap[_id].order !== order) {
        await SongRequest.findByIdAndUpdate(_id, { order });
      }
    }

    // Check for new requests and assign them the next order value
    const latestRequests = await SongRequest.find().sort({ order: 1 });
    for (let i = 0; i < latestRequests.length; i++) {
      if (latestRequests[i].order !== i) {
        await SongRequest.findByIdAndUpdate(latestRequests[i]._id, { order: i });
      }
    }

    io.emit('itemsUpdated');
    res.status(200).send();
  } catch (error) {
    console.error('Error reordering song requests:', error);
    res.status(500).send('Server Error');
  }
});

async function adjustOrdersAfterDeletion() {
  const requests = await SongRequest.find().sort({ order: 1 });

  for (let i = 0; i < requests.length; i++) {
    if (requests[i].order !== i) {
      await SongRequest.findByIdAndUpdate(requests[i]._id, { order: i });
    }
  }
}

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// server.listen(4000, () => {
//   console.log('Server is running on port 4000');
// });
