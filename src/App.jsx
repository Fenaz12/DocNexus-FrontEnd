import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import { ThemeProvider } from "./components/theme-provider"

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/chat" replace />} />

      <Route
        path="/chat/:threadId?"
        element={
          user ? <Chat /> : <Navigate to="/login" replace />
        }
      />

      <Route 
        path="/" 
        element={user ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />} 
      />
      
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;