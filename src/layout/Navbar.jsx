import React from 'react';
import { Link } from 'react-router-dom'; // Importamos Link
import '../styles/Navbar.css';
import logo from './../assets/logos/Logoulsa.png';

function Navbar({ active, toggleMenu }) {
    return (
        <>
            <div className="space">
                <img src={logo} alt="Logo" className="header-logo" />
            </div>
            <button className="menu-toggle" onClick={toggleMenu}>
                {active ? '✕' : '☰'}
            </button>
            <nav className={`navbar ${active ? 'open' : 'closed'}`}>
                <ul className="nav-links">
                    <li><Link to="/dashboard">Inicio</Link></li>
                    <li><Link to="/departamento">Departamentos</Link></li>
                    <li><Link to="/usuarios">Usuarios</Link></li>
                    <li><Link to="/cpresupuesto">Captura Presupuestos</Link></li>
                    <li><Link to="/categorias">Categorías</Link></li>
                    <li><Link to="/periodos">Periodos</Link></li>
                    <li><Link to="/autorizados">Autorizados</Link></li>
                    <li><Link to="/comprobantes">Comprobantes</Link></li>
                    <li><Link to="/configuracion">Configuracion</Link></li>
                </ul>
            </nav>
        </>
    );
}

export default Navbar;