import React from 'react';
import '../styles/Navbar.css';
import logo from './../assets/logos/Logoulsa.png'; // Asegúrate de que la ruta sea correcta
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
                    <li><a href="/">Inicio</a></li>
                    <li><a href="/departamento">Departamentos</a></li>
                    <li><a href="/usuarios">Usuarios</a></li>
                    <li><a href="/cpresupuesto">Captura Presupuestos</a></li>
                    <li><a href="/generar">Generar</a></li>
                    <li><a href="/convenios">Convenios</a></li>
                    <li><a href="/becas">Becas</a></li>
                    <li><a href="/clientes">Clientes</a></li>
                    <li><a href="/articulos">Articulos</a></li>
                    <li><a href="/servicios">Servicios</a></li>
                    <li><a href="/configuracion">Configuracion</a></li>
                </ul>
            </nav>
        </>
    );
}

export default Navbar;