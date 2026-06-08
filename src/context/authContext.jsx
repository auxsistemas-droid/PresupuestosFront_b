import { Children, createContext, useContext, useEffect,useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    //verificar si el usuario ya esta logueado
    useEffect(() => {
        api.get("/auth/me")
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    },[])

    //funcion para loguear al usuario
    const login = async (email, password) => {
        try {
            const res = await api.post("/auth/login", {Email: email, PasswordHash: password});
            return {success: true,message:res.data.message};
        } catch (error) {
            return {success: false, message: error.response?.data?.message || "Login failed"};
        }
    }
    //funcion para desloguear al usuario
    const logout = async () => {
        try {
            await api.post("/auth/logout");
            setUser(null);
        } catch (error){console.error("Logout failed", error);}
    };
    //proveer el contexto a los componentes hijos
    return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
);
};

export const useAuth = () => useContext(AuthContext);
