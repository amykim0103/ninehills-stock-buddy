import Login from "./Login";
import { useSession } from "@/lib/session";
import { Navigate } from "react-router-dom";

const Index = () => {
  const role = useSession((s) => s.role);
  if (role === "manager") return <Navigate to="/manager" replace />;
  if (role === "owner") return <Navigate to="/owner" replace />;
  return <Login />;
};

export default Index;
