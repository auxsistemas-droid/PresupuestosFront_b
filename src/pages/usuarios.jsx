import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Key,
  Building2,
  Mail,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import api from "../api/axios";

const getInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
};

const FORM_VACIO = {
  Nombre: '',
  APaterno: '',
  AMaterno: '',
  Correo: '',
  PasswordHash: '',
  Id_Departamento: 1,
  Activo: true
};

// Campos compartidos entre el panel de crear y el de editar, para no duplicar JSX
function CamposUsuario({ formData, onChange, departamentos, esEdicion, verPassword, setVerPassword, onGenerarPassword }) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre {!esEdicion && '*'}</label>
        <Input name="Nombre" required={!esEdicion} value={formData.Nombre} onChange={onChange} placeholder="Ej: Juan" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Apellido Paterno {!esEdicion && '*'}</label>
          <Input name="APaterno" required={!esEdicion} value={formData.APaterno} onChange={onChange} placeholder="Ej: Rodriguez" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Apellido Materno</label>
          <Input name="AMaterno" value={formData.AMaterno} onChange={onChange} placeholder="Ej: Hernandez" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Correo Electrónico {!esEdicion && '*'}</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="Correo" type="email" required={!esEdicion} className="pl-9" value={formData.Correo} onChange={onChange} placeholder="correo@ulsalaguna.edu.mx" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {esEdicion ? 'Cambiar Contraseña (Opcional)' : 'Contraseña (PasswordHash) *'}
          </label>
          {!esEdicion && (
            <button type="button" onClick={onGenerarPassword} className="text-[11px] text-indigo-600 hover:underline font-medium">
              Generar Contraseña
            </button>
          )}
        </div>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="PasswordHash"
            type={verPassword ? "text" : "password"}
            required={!esEdicion}
            className="pl-9 pr-9 font-mono"
            value={formData.PasswordHash}
            onChange={onChange}
            placeholder={esEdicion ? "Dejar en blanco para conservar" : "Contraseña"}
          />
          <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Departamento *</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            name="Id_departamento"
            value={formData.Id_departamento}
            onChange={onChange}
            className="w-full pl-9 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {departamentos.map((dep, index) => {
                const idDep = dep.Id_departamento ?? dep.Id_Departamento ?? dep.id;
                return (
                <option key={idDep ?? index} value={idDep}>
                    {dep.Nombre || `Departamento #${idDep}`}
                </option>
            );
            })}
          </select>
        </div>
      </div>
    </>
  );
}

function UsuariosTabla() {
  const [datos, setDatos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 8;

  const [panelCrearAbierto, setPanelCrearAbierto] = useState(false);
  const [panelDetalleUsuario, setPanelDetalleUsuario] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const [formData, setFormData] = useState(FORM_VACIO);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const cargarUsuarios = () => {
    setCargando(true);
    setError(null);
    api.get('/users')
      .then((res) => setDatos(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch((err) => {
        setError(err.response?.status === 401 ? "Sesión expirada. Por favor, inicia sesión de nuevo." : "Error al conectar con el servidor.");
      })
      .finally(() => setCargando(false));
  };

  const cargarDepartamentos = () => {
    api.get('/departamento')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) setDepartamentos(data);
      })
      .catch(() => {
        setDepartamentos([
          { Id_Departamento: 1, Nombre: 'Sistemas y TI' },
          { Id_Departamento: 2, Nombre: 'Administración' },
          { Id_Departamento: 3, Nombre: 'Finanzas' },
          { Id_Departamento: 4, Nombre: 'Recursos Humanos' }
        ]);
      });
  };

  useEffect(() => {
    cargarUsuarios();
    cargarDepartamentos();
  }, []);

  const generarPasswordAuto = () => {
    setFormData(prev => ({ ...prev, PasswordHash: "Ulsa" + Math.floor(1000 + Math.random() * 9000) }));
  };

  // Abre el panel de detalle; con edicion=true entra directo en modo edición (botón de lápiz en la tabla)
  const abrirPanelDetalle = (usuario, edicion = false) => {
    setPanelDetalleUsuario(usuario);
    setModoEdicion(edicion);
    setFormData({
      Nombre: usuario.Nombre || '',
      APaterno: usuario.APaterno || '',
      AMaterno: usuario.AMaterno || '',
      Correo: usuario.Correo || '',
      PasswordHash: '',
      Id_departamento: usuario.Id_Departamento || 1,
      Activo: usuario.Activo ?? true
    });
  };

  const abrirPanelCrear = () => {
    setFormData(FORM_VACIO);
    setVerPassword(false);
    setPanelCrearAbierto(true);
  };

  const handleGuardarNuevo = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/users', {
        Nombre: formData.Nombre,
        APaterno: formData.APaterno,
        AMaterno: formData.AMaterno,
        Correo: formData.Correo,
        PasswordHash: formData.PasswordHash,
        Id_departamento: Number(formData.Id_departamento)
      });
      setPanelCrearAbierto(false);
      cargarUsuarios();
    } catch (err) {
      alert("Error al guardar el usuario. Revisa que el correo no esté duplicado.");
    } finally {
      setGuardando(false);
    }
  };

const handleGuardarEdicion = async (e) => {
  e.preventDefault();
  if (!panelDetalleUsuario) return;
  setGuardando(true);

  // Mapea las propiedades exactamente como se llaman en tu clase User de TypeORM
  const payload = {
    Nombre: formData.Nombre,
    APaterno: formData.APaterno,
    AMaterno: formData.AMaterno || "",
    Correo: formData.Correo,
    Id_Departamento: formData.Id_Departamento || formData.Id_departamento ? Number(formData.Id_Departamento || formData.Id_departamento) : null,
    Activo: Boolean(formData.Activo)
  };

  if (formData.PasswordHash && formData.PasswordHash.trim() !== "") {
    payload.PasswordHash = formData.PasswordHash;
  }

  try {
    await api.put(`/users/${panelDetalleUsuario.Id_usuario}`, payload);
    setPanelDetalleUsuario(null);
    cargarUsuarios();
  } catch (err) {
    console.error("Error al actualizar:", err.response?.data || err.message);
    alert("Error al actualizar la información.");
  } finally {
    setGuardando(false);
  }
};
  const abrirModalEliminar = (e, usuario) => {
    e.stopPropagation();
    setUsuarioAEliminar(usuario);
    setModalEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!usuarioAEliminar) return;
    setGuardando(true);
    try {
      await api.delete(`/users/${usuarioAEliminar.Id_usuario}`);
      setModalEliminar(false);
      if (panelDetalleUsuario?.Id_usuario === usuarioAEliminar.Id_usuario) setPanelDetalleUsuario(null);
      setUsuarioAEliminar(null);
      cargarUsuarios();
    } catch (err) {
      alert("Error al eliminar el usuario.");
    } finally {
      setGuardando(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return datos.filter((u) => {
      const nombreCompleto = `${u.Nombre || ''} ${u.APaterno || ''} ${u.AMaterno || ''}`.toLowerCase();
      const correo = (u.Correo || '').toLowerCase();
      const roles = (u.usuarioRoles || []).map(r => r.rol?.Nombre || '').join(' ').toLowerCase();
      const coincide = nombreCompleto.includes(q) || correo.includes(q) || roles.includes(q);

      if (filtroEstado === 'activos') return coincide && u.Activo;
      if (filtroEstado === 'inactivos') return coincide && !u.Activo;
      return coincide;
    });
  }, [datos, busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / elementosPorPagina) || 1;
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [usuariosFiltrados, paginaActual]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-muted-foreground">Cargando directorio de usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <Button onClick={cargarUsuarios} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Haz clic en cualquier usuario para ver sus datos, o usa el lápiz para editarlo directo.</p>
        </div>
        <Button onClick={abrirPanelCrear} className="gap-2 shadow-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all px-4 py-2 rounded-lg shrink-0">
          <UserPlus className="h-4 w-4" />
          <span>Agregar Usuario</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg"><Users className="h-5 w-5" /></div>
          <div><p className="text-xs font-medium text-muted-foreground">Total Usuarios</p><p className="text-xl font-bold">{datos.length}</p></div>
        </div>
        <div className="p-4 rounded-xl border bg-card flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg"><UserCheck className="h-5 w-5" /></div>
          <div><p className="text-xs font-medium text-muted-foreground">Activos</p><p className="text-xl font-bold">{datos.filter(u => u.Activo).length}</p></div>
        </div>
        <div className="p-4 rounded-xl border bg-card flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg"><UserX className="h-5 w-5" /></div>
          <div><p className="text-xs font-medium text-muted-foreground">Inactivos</p><p className="text-xl font-bold">{datos.filter(u => !u.Activo).length}</p></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, correo..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            className="pl-9 pr-8 h-10 w-full"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
          {['todos', 'activos', 'inactivos'].map((st) => (
            <button
              key={st}
              onClick={() => { setFiltroEstado(st); setPaginaActual(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filtroEstado === st ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosPaginados.length > 0 ? (
              usuariosPaginados.map((usuario) => {
                const nombreCompleto = `${usuario.Nombre || ''} ${usuario.APaterno || ''} ${usuario.AMaterno || ''}`.trim() || 'Sin Nombre';
                return (
                  <TableRow
                    key={usuario.Id_usuario}
                    onClick={() => abrirPanelDetalle(usuario)}
                    className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-200/50">
                          {getInitials(nombreCompleto)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 transition-colors truncate">
                            {nombreCompleto}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">{usuario.Correo || 'Sin correo'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.usuarioRoles?.length > 0 ? (
                          usuario.usuarioRoles.map((userRol, rIdx) => (
                            <span key={rIdx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 border">
                              {userRol.rol?.Nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin rol</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        usuario.Activo ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 border border-amber-200/60'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${usuario.Activo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {usuario.Activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-500 hover:text-indigo-600"
                          onClick={(e) => { e.stopPropagation(); abrirPanelDetalle(usuario, true); }}
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-600"
                          onClick={(e) => abrirModalEliminar(e, usuario)}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No se encontraron usuarios registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {usuariosFiltrados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t bg-slate-50/50 dark:bg-slate-900/30">
            <span className="text-xs text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{(paginaActual - 1) * elementosPorPagina + 1}</span> a{' '}
              <span className="font-medium text-foreground">{Math.min(paginaActual * elementosPorPagina, usuariosFiltrados.length)}</span> de{' '}
              <span className="font-medium text-foreground">{usuariosFiltrados.length}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium whitespace-nowrap">Página {paginaActual} de {totalPaginas}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* PANEL: CREAR USUARIO */}
      {panelCrearAbierto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nuevo Usuario</h2>
                  <p className="text-xs text-muted-foreground">Ingresa las credenciales para registrar un usuario.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPanelCrearAbierto(false)}><X className="h-5 w-5" /></Button>
              </div>

              <form id="form-crear" onSubmit={handleGuardarNuevo} className="space-y-4">
                <CamposUsuario
                  formData={formData}
                  onChange={handleChange}
                  departamentos={departamentos}
                  esEdicion={false}
                  verPassword={verPassword}
                  setVerPassword={setVerPassword}
                  onGenerarPassword={generarPasswordAuto}
                />
              </form>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-6 shrink-0">
              <Button variant="outline" onClick={() => setPanelCrearAbierto(false)}>Cancelar</Button>
              <Button type="submit" form="form-crear" disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {guardando ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL: DETALLE / EDICIÓN */}
      {panelDetalleUsuario && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl p-4 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">#{panelDetalleUsuario.Id_usuario}</span>
                  <h2 className="text-lg font-bold">{modoEdicion ? 'Editar Usuario' : 'Ficha de Usuario'}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPanelDetalleUsuario(null)}><X className="h-5 w-5" /></Button>
              </div>

              <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border text-center">
                <div className="h-16 w-16 rounded-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center mb-3 shadow-md">
                  {getInitials(`${formData.Nombre} ${formData.APaterno}`)}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{`${formData.Nombre} ${formData.APaterno} ${formData.AMaterno}`.trim()}</h3>
                <p className="text-xs text-muted-foreground">{formData.Correo}</p>
                <button
                  onClick={() => setModoEdicion(!modoEdicion)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 transition-all border border-indigo-200/50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {modoEdicion ? 'Cancelar Edición' : 'Editar Datos'}
                </button>
              </div>

              {!modoEdicion ? (
                <div className="space-y-4 divide-y">
                  <div className="pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Correo</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[60%] text-right">{panelDetalleUsuario.Correo}</span>
                  </div>
                  <div className="pt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Departamento</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">ID #{panelDetalleUsuario.Id_Departamento || 1}</span>
                  </div>
                  <div className="pt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><UserIcon className="h-4 w-4" /> Estado</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${panelDetalleUsuario.Activo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {panelDetalleUsuario.Activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ) : (
                <form id="form-editar" onSubmit={handleGuardarEdicion} className="space-y-4">
                  <CamposUsuario
                    formData={formData}
                    onChange={handleChange}
                    departamentos={departamentos}
                    esEdicion={true}
                    verPassword={verPassword}
                    setVerPassword={setVerPassword}
                    onGenerarPassword={generarPasswordAuto}
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit-activo"
                      name="Activo"
                      checked={formData.Activo}
                      onChange={handleChange}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="edit-activo" className="text-sm font-medium">Usuario Activo</label>
                  </div>
                </form>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-6 shrink-0">
              {modoEdicion ? (
                <>
                  <Button variant="outline" onClick={() => setModoEdicion(false)}>Cancelar</Button>
                  <Button type="submit" form="form-editar" disabled={guardando} className="bg-indigo-600 text-white">
                    {guardando ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Guardar Cambios'}
                  </Button>
                </>
              ) : (
                <Button variant="destructive" className="col-span-2 gap-2" onClick={(e) => abrirModalEliminar(e, panelDetalleUsuario)}>
                  <Trash2 className="h-4 w-4" /> Eliminar Usuario
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR */}
      {modalEliminar && usuarioAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Usuario?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar a <span className="font-semibold text-foreground">{usuarioAEliminar.Nombre} {usuarioAEliminar.APaterno}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalEliminar(false)}>Cancelar</Button>
              <Button onClick={handleConfirmarEliminar} disabled={guardando} variant="destructive">
                {guardando ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Sí, Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosTabla;
