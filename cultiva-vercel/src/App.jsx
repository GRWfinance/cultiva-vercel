import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import OneOnOnes from './pages/OneOnOnes';
import Feedbacks from './pages/Feedbacks';
import Benefits from './pages/Benefits';
import OKRs from './pages/OKRs';
import PDI from './pages/PDI';
import Reviews from './pages/Reviews';
import Surveys from './pages/Surveys';
import Kudos from './pages/Kudos';
import Succession from './pages/Succession';
import PeopleAnalytics from './pages/PeopleAnalytics';
import Learning from './pages/Learning';
import { Loading } from './components/States';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 60 }}><Loading label="Verificando sessão..." /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="1-1s" element={<OneOnOnes />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="beneficios" element={<Benefits />} />
        <Route path="avaliacoes" element={<Reviews />} />
        <Route path="okrs" element={<OKRs />} />
        <Route path="pdi" element={<PDI />} />
        <Route path="pesquisas" element={<Surveys />} />
        <Route path="elogios" element={<Kudos />} />
        <Route path="sucessao" element={<Succession />} />
        <Route path="people-analytics" element={<PeopleAnalytics />} />
        <Route path="learning" element={<Learning />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
