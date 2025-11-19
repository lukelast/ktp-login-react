import { Route, Routes } from "react-router-dom";
import { getAuthRoutes } from "../routes";

export const AuthRoutes = () => {
    const routes = getAuthRoutes();
    return (
        <Routes>
            {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
            ))}
        </Routes>
    );
};
