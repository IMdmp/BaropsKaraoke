import React, { useState } from 'react';
import axios from 'axios';

const YouTubeSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [requesterName, setRequesterName] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get('http://localhost:8080/search', {
                params: {
                    query: query,
                }
            });
            setResults(response.data);
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
            const song = selectedItem.title;
            const url = selectedItem.url;

            const songRequestData = {
                song,
                songRequester: requesterName || 'Anonymous',
                url,
            };

            try {
                await axios.post('http://localhost:4000/songRequests', songRequestData);
                alert('Song request queued successfully');
                setSelectedItem(null); // Reset the selection
            } catch (error) {
                console.error('Error adding song request to queue', error);
                alert('Error adding song request to queue');
            }
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <form onSubmit={handleSearch} style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
                <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Requester Name"
                    style={{
                        marginBottom: '10px',
                        padding: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        boxSizing: 'border-box'
                    }}
                />
                <br />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search YouTube"
                    style={{
                        padding: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        boxSizing: 'border-box'
                    }}
                />
                <button type="submit" style={{ marginLeft: '10px', padding: '8px 16px', width: 'auto', minWidth: '120px' }}>Search</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', width: '100%' }}>
                {results.map((result, index) => (
                    <div
                        key={index}
                        onClick={() => handleItemClick(result)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px',
                            backgroundColor: selectedItem === result ? 'lightgreen' : '#f9f9f9',
                            cursor: 'pointer',
                            margin: '10px 0',
                            width: '90%',
                            maxWidth: '500px',
                            borderRadius: '5px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            position: 'relative',
                            flexWrap: 'wrap' // Ensures the content wraps on smaller screens
                        }}
                    >
                        <img src={result.thumbnailUrl} alt={result.title} style={{ width: '100px', borderRadius: '4px', flexShrink: 0 }} />
                        <p style={{ marginLeft: '10px', flex: '1', textAlign: 'left', minWidth: '60%' }}>{result.title}</p>
                        {selectedItem === result && (
                            <button
                                onClick={handleQueue}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px', // Adds space for better mobile view
                                    width: '100%', // Button takes full width on smaller screens
                                    maxWidth: '150px'
                                }}
                            >
                                Queue This
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default YouTubeSearch;
