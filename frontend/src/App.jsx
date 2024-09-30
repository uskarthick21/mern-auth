import {Route, Routes, useNavigate} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AppContainer from "./components/AppContainer";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { setNavigate } from "./lib/navigation";

export const Home = () => {
  return <div>Home</div>
}
// login, register, email verify, password are all public routes. 
// Home page should be visible when user is logged in. So it is Protected routes. all user athuntication check would be in AppContainer.

function App() {
  // video 4.48.15
  // Since we cannot use useNavigate in apiClient because of normal function.
  // we are trying to call from memory. So we could import and use in normal function.
  // Note: useNavigate is hook, So we caould use only inside react component.
  const navigate = useNavigate();
  setNavigate(navigate);
  return (
   <Routes>
      <Route path="/" element={<AppContainer />} >
        <Route index element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />}/>
    <Route path="/email/verify/:code" element={<VerifyEmail />} />
    <Route path="/password/forgot" element={<ForgotPassword />}/>
    <Route path="/password/reset" element={<ResetPassword />}/>
   </Routes>
  )
}

export default App
