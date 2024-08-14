import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSwipeable } from 'react-swipeable';
import { io } from 'socket.io-client';

const App = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Fetch initial items from the server
    const fetchItems = async () => {
      const response = await axios.get('http://localhost:4000/items');
      setItems(response.data);
    };
    fetchItems();

    // Setup the Socket.IO client
    const socket = io('http://localhost:4000');

    socket.on('itemsUpdated', () => {
      fetchItems(); // Re-fetch the items when they are updated
    });

    // Cleanup the socket connection on component unmount
    return () => socket.disconnect();
  }, []);

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    // Update the order locally
    reorderedItems.forEach((item, index) => {
      item.order = index;
    });
    setItems(reorderedItems);

    await axios.put('http://localhost:4000/items/reorder', {
      reorderedItems,
    });
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:4000/items/${id}`);
    setItems(items.filter((item) => item._id !== id));
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
            {items.map((item, index) => {
              const swipeHandlers = useSwipeable({
                onSwipedLeft: () => handleDelete(item._id),
                preventDefaultTouchmoveEvent: true,
                trackMouse: true,
              });

              return (
                <Draggable key={item._id} draggableId={item._id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      {...swipeHandlers}
                      style={{
                        padding: '8px',
                        margin: '4px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {item.content}
                    </li>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default App;
