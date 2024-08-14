import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const App = () => {
  const [songRequests, setSongRequests] = useState([]);

  useEffect(() => {
    const fetchSongRequests = async () => {
      const response = await axios.get('http://localhost:4000/songRequests');
      setSongRequests(response.data);
    };
    fetchSongRequests();
  }, []);

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedRequests = Array.from(songRequests);
    const [movedRequest] = reorderedRequests.splice(result.source.index, 1);
    reorderedRequests.splice(result.destination.index, 0, movedRequest);

    reorderedRequests.forEach((request, index) => {
      request.order = index;
    });
    setSongRequests(reorderedRequests);

    await axios.put('http://localhost:4000/songRequests/reorder', {
      reorderedItems: reorderedRequests,
    });
  };

  const handleDelete = useCallback(async (id) => {
    await axios.delete(`http://localhost:4000/songRequests/${id}`);
    setSongRequests((prevRequests) =>
      prevRequests.filter((request) => request._id !== id)
    );
  }, []);

  const openInNewWindow = (url, id)  => {
    const width = window.screen.width / 2 +200; // Half of the screen width
    const height = window.screen.height; // Half of the screen height
    const left = window.screen.width - width; // Position it at the right
    const top = 0; // Position it at the top

    window.open(
      url,
      'songWindow',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    handleDelete(id);
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ listStyleType: 'none', padding: 0 }}
          >
            {songRequests.map((request, index) => (
              <Draggable key={request._id} draggableId={request._id} index={index}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      padding: '8px',
                      margin: '4px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      ...provided.draggableProps.style,
                    }}
                  >
                    <div>
                      <strong>{request.song}</strong> by {request.songRequester}
                    </div>
                    <div>
                      <button onClick={() => openInNewWindow(request.url, request._id)}>
                        Listen
                      </button>
                    </div>
                    <div>
                      Requested at: {new Date(request.timeRequested).toLocaleString()}
                    </div>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default App;
