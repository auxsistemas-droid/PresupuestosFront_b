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
                    <li><a href="/categorias">Categorías</a></li>
                    <li><a href="/periodos">Periodos</a></li>
                    <li><a href="/autorizados">Autorizados</a></li>
                    <li><a href="/comprobantes">Comprobantes</a></li>
                    <li><a href="/configuracion">Configuracion</a></li>
                </ul>
            </nav>
        </>
    );
}

export default Navbar;