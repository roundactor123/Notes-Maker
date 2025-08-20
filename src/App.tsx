import React, { useState, useEffect } from 'react';
import './App.css';
import DrawingCanvas from './components/DrawingCanvas';
import './components/DrawingCanvas.css';
import customLogo from './custom-logo.svg';

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  drawing?: string; // Base64 encoded drawing
}

// Color palette for notes
const NOTE_COLORS = [
  '#00BFA6', // Teal Glow
  '#9F75FF', // Soft Violet
  '#F67280', // Blush Coral
  '#FFCB05', // Electric Yellow
  '#45A29E', // Cool Aqua
  '#FF8C42', // Saffron Neon
  '#5CDB95', // Calm Mint
  '#836FFF', // Iris Vibe
];

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Load notes from localStorage on initial render
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Failed to parse saved notes:', error);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  // Create a new note
  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      createdAt: Date.now(),
    };
    setNotes([...notes, newNote]);
    setActiveNote(newNote);
  };

  // Update a note
  const updateNote = (updatedNote: Note) => {
    setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note));
    setActiveNote(updatedNote);
  };

  // Delete a note
  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
    }
  };

  // Save drawing to note
  const saveDrawing = (drawingData: string) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, drawing: drawingData };
      updateNote(updatedNote);
      setIsDrawing(false);
    }
  };

  // Double click anywhere to create a new note
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only create a note if clicking on the background, not on a note or modal
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains('app-container') ||
      (e.target as HTMLElement).classList.contains('notes-container')
    ) {
      createNote();
    }
  };

  return (
    <div className="app-container" onDoubleClick={handleDoubleClick}>
      <div className="app-header">
        <div className="logo-container">
          <img src={customLogo} alt="Noted Logo" width="50" height="50" />
        </div>
        <h1>Noted</h1>
      </div>
      
      <div className="notes-container">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="note-card" 
            style={{ backgroundColor: note.color }}
            onClick={() => setActiveNote(note)}
          >
            <h3 className="note-title">{note.title}</h3>
            <p className="note-content">{note.content}</p>
            {note.drawing && (
              <div className="note-drawing-preview">
                <img src={note.drawing} alt="Drawing" />
              </div>
            )}
            <div className="note-actions">
              <button 
                className="action-button delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                aria-label="Delete note"
              >
                🗑️
              </button>
              <button 
                className="action-button draw-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNote(note);
                  setIsDrawing(true);
                }}
                aria-label="Draw on note"
              >
                ✏️
              </button>
            </div>
          </div>
        ))}
        
        <div className="new-note-button" onClick={createNote} role="button" aria-label="Create new note">
          <span>+</span>
          <p>new note</p>
        </div>
      </div>

      {/* Note Editor Modal */}
      {activeNote && !isDrawing && (
        <div className="modal-overlay" onClick={() => setActiveNote(null)}>
          <div className="note-editor" style={{ backgroundColor: activeNote.color }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="editor-title"
              value={activeNote.title}
              onChange={(e) => updateNote({ ...activeNote, title: e.target.value })}
              placeholder="Title"
              aria-label="Note title"
            />
            <textarea
              className="editor-content"
              value={activeNote.content}
              onChange={(e) => updateNote({ ...activeNote, content: e.target.value })}
              placeholder="Write your note here..."
              aria-label="Note content"
            />
            {activeNote.drawing && (
              <div className="drawing-preview">
                <img src={activeNote.drawing} alt="Drawing" />
              </div>
            )}
            <div className="editor-actions">
              <button 
                className="action-button close-button"
                onClick={() => setActiveNote(null)}
                aria-label="Close editor"
              >
                Close
              </button>
              <div className="color-picker" role="group" aria-label="Note color options">
                {NOTE_COLORS.map(color => (
                  <div 
                    key={color}
                    className={`color-option ${activeNote.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateNote({ ...activeNote, color })}
                    role="button"
                    aria-label={`Select color ${color}`}
                    aria-pressed={activeNote.color === color}
                  />
                ))}
              </div>
              <button 
                className="action-button draw-button"
                onClick={() => setIsDrawing(true)}
                aria-label="Open drawing canvas"
              >
                Draw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Canvas Modal */}
      {isDrawing && activeNote && (
        <div className="modal-overlay">
          <div className="drawing-editor" onClick={(e) => e.stopPropagation()}>
            <h3>Drawing Canvas</h3>
            <DrawingCanvas 
              onSave={saveDrawing} 
              initialDrawing={activeNote.drawing}
            />
            <div className="drawing-actions">
              <button 
                className="action-button cancel-button"
                onClick={() => setIsDrawing(false)}
                aria-label="Cancel drawing"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
