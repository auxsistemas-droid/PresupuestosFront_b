// src/layout/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderN from './HeaderN';
import Navbar from './Navbar';
import './../styles/Dashboard.css'; // Mantenemos los estilos del contenedor principal

function MainLayout() {
    const [isSidebarActive, setIsSidebarActive] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarActive(!isSidebarActive);
    };

    return (
        <>
            <HeaderN />
            <div className={`layout ${isSidebarActive ? 'sidebar-open' : 'sidebar-closed'}`}>
                <aside className="sidebar">
                    <Navbar active={isSidebarActive} toggleMenu={toggleSidebar} />
                </aside>
                
                <main className="main-content">
                    {/* 🪄 AQUÍ ESTÁ LA MAGIA: El Outlet es el espacio dinámico */}
                    <Outlet /> 
                </main>
            </div>
        </>
    );
}

export default MainLayout;