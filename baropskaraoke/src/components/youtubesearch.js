import React, { useState } from 'react';
import axios from 'axios';

const YouTubeSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const API_KEY = '';
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          maxResults: 10,
          q: query,
          key: API_KEY
        }
      });
      setResults(response.data.items);
    } catch (error) {
      console.error('Error fetching data from YouTube API', error.response || error.message);
      alert('There was an issue with your search request.');
    }
  };


  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleQueue = async () => {
    if (selectedItem) {
      const song = selectedItem.snippet.title;
      const url = `https://www.youtube.com/watch?v=${selectedItem.id.videoId}`;
      const songRequester = 'User Name'; // Replace this with the actual requester if available

      // Move the object to a separate variable for clarity
      const songRequestData = {
        song,
        songRequester,
        url,
      };

      try {
        await axios.post('http://localhost:4000/songRequests', songRequestData);
        alert('Song request queued successfully');
      } catch (error) {
        console.error('Error adding song request to queue', error);
        alert('Error adding song request to queue');
      }
    }
  };


  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube"
        />
        <button type="submit">Search</button>
      </form>
      <div>
        {results.map((item) => (
          <div
            key={item.id.videoId}
            onClick={() => handleItemClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: selectedItem === item ? 'lightgreen' : 'transparent',
              cursor: 'pointer',
              margin: '10px 0'
            }}
          >
            <img src={item.snippet.thumbnails.default.url} alt={item.snippet.title} />
            <p>{item.snippet.title}</p>
          </div>
        ))}
      </div>
      {selectedItem && (
        <button onClick={handleQueue}>
          Queue This
        </button>
      )}
    </div>
  );
};

export default YouTubeSearch;
