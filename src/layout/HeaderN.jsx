import React, { useState } from 'react';
import axios from 'axios';
import Logo from './../assets/logos/Logoulsa.png'; // Asegúrate de que la ruta sea correcta
import {useNavigate} from 'react-router-dom';
import '../styles/HeaderN.css';
import { motion } from "framer-motion";

function HeaderN() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();


    const handleLogout = async () => {
        try{
            await axios.post('http://localhost:3000/api/auth/logout', {}, {
                withCredentials: true
            }); 
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
        finally {
            setIsMenuOpen(false);
            navigate("/login");
        }
    };

return (
        <header className="header">
            <div className="header-left">
                <a href="https://lasallelaguna.mx/" className="header-logo-link">
                    <img src={Logo} alt="Logo" className="header-logo" />
                </a>
                <motion.div
                initial={{ opacity: 0}}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                >
                <h1 className="header-title">PRESUPUESTOS ULSA</h1>
                </motion.div>
            </div>
            
            <div className="header-actions">
                <button className="header-icon-btn">🔔</button>
                
                <div className="user-menu-container">
                    <button 
                        className="user-icon-btn" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        👤
                    </button>

                    {isMenuOpen && (
                        <div className="dropdown-menu">
                            <button onClick={handleLogout} className="logout-item">
                                <span className="icon">🚪</span> Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default HeaderN;