import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Confirmar from "./pages/Confirmar";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import Departamento from "./pages/departamento";
import Usuarios from "./pages/usuarios";
import CPresupuestos from "./pages/presupuestos";
import './index.css';
import MainLayout from "./layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/confirmar" element={<Confirmar />} />
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/departamento" element={<Departamento />} />
            <Route path="/usuarios" element={<Usuarios/>}/>
            <Route path="/cpresupuesto" element={<CPresupuestos/>}/>

          </Route>

        </Routes>
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;