import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import { ThemeProvider } from "./components/theme-provider";
import { Loader2 } from "lucide-react"; // Assuming you have lucide-react installed


const ServerAwakener = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-4 text-center">
      <div className="mb-6 animate-spin">
        <Loader2 size={64} className="text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Waking up the Server...</h1>
      <p className="text-slate-400 max-w-md">
        This demo runs on Render's <strong>Free Tier</strong>. 
        <br />
        The server sleeps after inactivity. This initial boot takes about <strong>60 seconds</strong>.
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Status: <span className="text-yellow-500 animate-pulse">Pinging backend...</span>
      </p>
    </div>
  );
};

function App() {
  const [isServerReady, setIsServerReady] = useState(false);
  
  // Use your environment variable, or fallback to the hardcoded URL
  const API_URL = "https://docnexus-py.onrender.com";

  // --- 2. The Polling Logic ---
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // We use a simple fetch to the root health check
        const response = await fetch(`${API_URL}/`);
        
        if (response.ok) {
          const data = await response.json();
          setIsServerReady(true);
        } else {
          throw new Error("Server not ready");
        }
      } catch (error) {
        setTimeout(checkServerStatus, 2000);
      }
    };

    checkServerStatus();
  }, []);

  if (!isServerReady) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ServerAwakener />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/chat/:threadId?"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;