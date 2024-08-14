import React, { useState } from 'react';

const YouTubeSearch = () => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // The search query will automatically update the iframe src
    };

    return (
        <div>
            <h1>YouTube Search</h1>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search YouTube"
                    style={{ padding: '10px', fontSize: '16px', width: '300px' }}
                />
                <button type="submit" style={{ padding: '10px', fontSize: '16px', marginLeft: '10px' }}>
                    Search
                </button>
            </form>
            <div style={{ marginTop: '20px' }}>
                {query && (
                    <iframe
                        title="YouTube Search Results"
                        width="800"
                        height="450"
                        src={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                        frameBorder="0"
                        allowFullScreen
                    ></iframe>
                )}
            </div>
        </div>
    );
};

export default YouTubeSearch;
