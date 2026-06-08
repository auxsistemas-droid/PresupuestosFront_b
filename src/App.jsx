import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Confirmar from "./pages/Confirmar";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import './index.css';
function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/confirmar" element={<Confirmar />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;