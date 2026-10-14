import {Navigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({allowedRoles, children}) => {
    const {user, loading, hasRole} = useAuth();
    console.log("user:", user, "allowed:", allowedRoles, "hasRole:", allowedRoles && hasRole(...allowedRoles));


    if(loading) return <p>Loading...</p>;

    if(!user) return <Navigate to="/login" replace/>;

    if(allowedRoles && !hasRole(...allowedRoles)) {
        return <Navigate to="/not-authorized" replace />;
    }

    return children;
};

export default ProtectedRoute;