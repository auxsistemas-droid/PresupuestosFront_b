import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../styles/Login.css';
import api from "../api/axios";


function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [mensaje, setMensaje] = useState("");
    const [esperando, setEsperando] = useState(false);
    const [form, setForm] = useState({ Email: "", Password: "" });

    // LÓGICA DE POLLING
    useEffect(() => {
        if (!esperando) return;

        const interval = setInterval(async () => {
            try {
                // Verificamos si la sesión ya fue autorizada en el correo
                const res = await api.get("/auth/me");
                console.log("Verificando sesión...");
                console.log(res.data);
                if (res.data) {
                    console.log("Sesión detectada, redirigiendo...");
                    clearInterval(interval);
                    navigate("/dashboard");
                }
            } catch (err) {
                console.log("Esperando confirmación...");
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [esperando, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje("Verificando...");
        
        const result = await login(form.Email, form.Password);
        
        if (result.success) {
             navigate("/dashboard");
        } else {
            setMensaje(result.message || "Error al iniciar sesión");
            setEsperando(false);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <h2 className="card-title">Bienvenido A TESULSA</h2>
                <p className="card-sub">
                    {esperando ? "Esperando confirmación desde tu correo..." : "Ingresa tus credenciales para continuar"}
                </p>

                <div className="field">
                    <label className="label">Email</label>
                    <div className="input-wrap">
                        <input 
                            type="email" 
                            className="input"
                            placeholder="correo@ejemplo.com"
                            disabled={esperando} // Bloquea si ya está esperando
                            onChange={e => setForm({ ...form, Email: e.target.value })} 
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="label">Contraseña</label>
                    <div className="input-wrap">
                        <input 
                            type="password" 
                            className="input"
                            placeholder="••••••••"
                            disabled={esperando}
                            onChange={e => setForm({ ...form, Password: e.target.value })} 
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="button" disabled={esperando}>
                    {esperando ? "Procesando..." : "Iniciar sesión"}
                </button>

                {mensaje && <p className={`message ${esperando ? 'info' : 'error'}`}>{mensaje}</p>}
            </form>
        </div>
    );
}

export default Login;