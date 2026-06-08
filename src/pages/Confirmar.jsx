import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

function Confirmar() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [mensaje, setMensaje] = useState("Verificando...");

    useEffect(() => {
        const token = searchParams.get("token");

        api.get(`/auth/confirmar?token=${token}`)
            .then(res => {
                setMensaje("Sesión confirmada. Redirigiendo...");
                setTimeout(() => navigate("/dashboard"), 1500);
            })
            .catch(() => {
                setMensaje("Token inválido o expirado.");
                setTimeout(() => navigate("/login"), 2000);
            });
    }, []);

    return <p>{mensaje}</p>;
}

export default Confirmar;