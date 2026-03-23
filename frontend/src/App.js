import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));
const Watch = lazy(() => import('./pages/Watch'));
const VideoDetails = lazy(() => import('./pages/VideoDetails'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const MyList = lazy(() => import('./pages/MyList'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const token = localStorage.getItem('token');

  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={token ? <Navigate to="/browse" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/browse" /> : <Register />} />
        
        <Route element={<Layout />}>
          <Route path="/browse" element={<PrivateRoute><Browse /></PrivateRoute>} />
          <Route path="/watch/:id" element={<PrivateRoute><Watch /></PrivateRoute>} />
          <Route path="/video/:id" element={<PrivateRoute><VideoDetails /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/my-list" element={<PrivateRoute><MyList /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;