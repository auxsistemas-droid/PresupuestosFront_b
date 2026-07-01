import './../styles/Dashboard.css';
import React, { useState } from 'react';

function Dashboard() {
    const [isSidebarActive, setIsSidebarActive] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarActive(!isSidebarActive);
    };
    return (
        <>
        <main className="main-content">
            
            <div className="dashboard">
            {/* Fila 1 - 4 cards */}
            <div className="card span-3 card-sm">Card 1</div>
            <div className="card span-3 card-sm">Card 2</div>
            <div className="card span-3 card-sm">Card 3</div>
            <div className="card span-3 card-sm">Card 4</div>

            {/* Fila 2 - 3 cards */}
            <div className="card span-8 card-lg">Gráfico</div>
            <div className="card span-8 card-lg">Dona</div>
            <div className="card span-8 card-lg">Movimientos</div>

            {/* Fila 3 - 3 cards */}
            <div className="card span-4 card-md">Barras</div>
            <div className="card span-4 card-md">Alertas</div>
            <div className="card span-4 card-md">Atajos</div>
            </div>
        </main>
</>
    );
}

export default Dashboard;