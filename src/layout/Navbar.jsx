import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';
import logo from './../assets/logos/Logoulsa.png';

const links = [
    { to: "/dashboard", label: "Inicio", roles: ["Administrador"] },
    { to: "/departamento", label: "Departamentos", roles: ["Administrador"] },
    { to: "/usuarios", label: "Usuarios", roles: ["Administrador"] },
    { to: "/cpresupuesto", label: "Captura Presupuestos", roles: ["Administrador","Usuario"] },
    { to: "/categorias", label: "Categorías", roles: ["Administrador"] },
    { to: "/periodos", label: "Periodos", roles: ["Administrador"] },
    { to: "/revision", label: "Revision", roles: ["Administrador"] },
    { to: "/licencias", label: "Licencias", roles: ["Administrador"] },
    { to: "/configuracion", label: "Configuracion", roles: ["Administrador"] },
];

function Navbar({ active, toggleMenu }) {
    const { hasRole } = useAuth();
    const visibles = links.filter(l => hasRole(...l.roles));

    return (
        <>
            <div className="space">
                <img src={logo} alt="Logo" className="header-logo" />
            </div>
            {visibles.length > 0 && (
                <button className="menu-toggle" onClick={toggleMenu}>
                    {active ? '✕' : '☰'}
                </button>
            )}
            <nav className={`navbar ${active ? 'open' : 'closed'}`}>
                <ul className="nav-links">
                    {visibles.map(l => (
                        <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
                    ))}
                </ul>
            </nav>
        </>
    );
}

export default Navbar;