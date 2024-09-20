import {Route, Routes} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AppContainer from "./components/AppContainer";

export const Home = () => {
  return <div>Home</div>
}
// login, register, email verify, password are all public routes. 
// Home page should be visible when user is logged in. So it is Protected routes. all user athuntication check would be in AppContainer.

function App() {
  return (
   <Routes>
      <Route path="/" element={<AppContainer />} >
        <Route index element={<Home />} />
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
