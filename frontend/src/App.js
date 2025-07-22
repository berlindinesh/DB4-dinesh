import './App.css';
import { Route, BrowserRouter, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import MainScreen from './screens/mainScreen/MainScreen';
import LoginPage from './screens/authScreens/loginScreen/LoginPage';
import HomeScreen from './screens/HomeScreen';
import Dashboard from './screens/templates/Dashboard';
import PrivateRoute from './screens/PrivateRoute';
import { Container } from 'react-bootstrap';
import { SidebarProvider } from './Context';
import VerifyOtpPage from './screens/authScreens/registerScreen/VerifyOtpPage';
import ForgotPassword from './screens/authScreens/forgotPassword/ForgotPassword';
import ResetPassword from './screens/authScreens/resetPassword/ResetPassword';
import Settings from './screens/Settings';
import { NotificationProvider } from './context/NotificationContext';
import RegisterCompanyPage from './screens/authScreens/registerScreen/RegisterCompanyPage.js';
import CompanySettings from './screens/authScreens/auth/CompanySettings.js';
import { selectIsAuthenticated, selectAuthLoading , logoutUser } from './redux/authSlice';
import ChangePassword from './screens/authScreens/ChangePassword.js';

// Create a wrapper component to use hooks
function AppContent() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    console.log('App mounted, authentication state:', isAuthenticated);
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (isAuthenticated && !token) {
      console.log('Token missing but state shows authenticated - dispatching logout');
      dispatch(logoutUser());
    }
  }, [isAuthenticated, dispatch]);
  
  // Add the navigation effect with debounce
  useEffect(() => {
    // Skip this effect during authentication transitions
    if (loading) return;
    
    // Check if user is authenticated but not on a protected route
    if (isAuthenticated) {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/login') {
        console.log('User is authenticated but on public route, redirecting to dashboard');
        
        // Use a small timeout to prevent rapid navigation
        const timeoutId = setTimeout(() => {
          navigate('/Dashboards');
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isAuthenticated, navigate, loading, location.pathname]);
  
  return (
    <>
      <Header />
      <Container fluid style={{ padding: "0", margin: "0", width: "100%" }}>
        <Routes>
          <Route path='/' element={<MainScreen />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path='/reset-password/:token' element={<ResetPassword />} />
          <Route path='/register' element={<RegisterCompanyPage />} />
          <Route path='/verifyOtp' element={<VerifyOtpPage />} />
          <Route path='/verify-email' element={<VerifyOtpPage />} />
      
          <Route element={<PrivateRoute />}>
            <Route path='/home' element={<HomeScreen />} />
            <Route path='/Dashboards/*' element={<Dashboard />} />
            <Route path="/admin/company-settings" element={<CompanySettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>
        </Routes>
      </Container>
    </>
  );
}


// Main App component
function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SidebarProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
