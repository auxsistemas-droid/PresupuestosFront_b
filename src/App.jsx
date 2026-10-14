import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Periodos from "./pages/periodos";
import Categorias from "./pages/categorias";
import Revision from "./pages/revision";
import NoAutorizado from "./pages/no-autorizado";

function App() {
  return (
    <HashRouter>
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
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["Administrador"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/departamento" element={<ProtectedRoute allowedRoles={["Administrador"]}><Departamento /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute allowedRoles={["Administrador"]}><Usuarios /></ProtectedRoute>} />
            <Route path="/cpresupuesto" element={<ProtectedRoute allowedRoles={["Administrador","Usuario"]}><CPresupuestos /></ProtectedRoute>} />
            <Route path="/periodos" element={<ProtectedRoute allowedRoles={["Administrador"]}><Periodos /></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute allowedRoles={["Administrador"]}><Categorias /></ProtectedRoute>} />
            <Route path="/revision" element={<ProtectedRoute allowedRoles={["Administrador"]}><Revision /></ProtectedRoute>} />
            <Route path="/not-authorized" element={<NoAutorizado />} />
          </Route>

        </Routes>
        </AuthProvider>
      </HashRouter>
  );
}

export default App;