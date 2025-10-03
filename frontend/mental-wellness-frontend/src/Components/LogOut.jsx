import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(); // end session
    navigate("/sign-in"); // navigate to SignIn page
  };

  return <button onClick={handleLogout}>Logout</button>;
}

export default LogoutButton;
