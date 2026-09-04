import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/todos`);
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      if (!response.ok) throw new Error('Failed to add todo');
      setTitle('');
      setDescription('');
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      const response = await fetch(`${API_URL}/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: todo.title, 
          description: todo.description, 
          completed: !todo.completed 
        })
      });
      if (!response.ok) throw new Error('Failed to update todo');
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      fetchTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>📝 Todo Application</h1>
        <p className="subtitle">Keep track of your tasks</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleAddTodo} className="add-todo-form">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-title"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-description"
          rows="2"
        />
        <button type="submit" className="btn-add">Add Todo</button>
      </form>

      {loading ? (
        <div className="loading">Loading todos...</div>
      ) : todos.length === 0 ? (
        <div className="empty-state">
          <p>No todos yet. Add one to get started! 🚀</p>
        </div>
      ) : (
        <div className="todos-list">
          {todos.map(todo => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo)}
                className="todo-checkbox"
              />
              <div className="todo-content">
                <h3 className="todo-title">{todo.title}</h3>
                {todo.description && <p className="todo-description">{todo.description}</p>}
              </div>
              <button 
                onClick={() => handleDeleteTodo(todo.id)}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="stats">
        <span>{todos.filter(t => !t.completed).length} active</span>
        <span>{todos.filter(t => t.completed).length} completed</span>
        <span>{todos.length} total</span>
      </div>
    </div>
  );
}

export default App;
