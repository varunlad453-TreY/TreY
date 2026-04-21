import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SSOSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Set the token securely
      localStorage.setItem('token', token);
      
      // Small delay to ensure state updates, then redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } else {
      // Failed or invalid SSO
      navigate('/login?error=sso_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: '#3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <h2 style={{ marginTop: '20px', fontFamily: 'Inter, sans-serif' }}>Authenticating with Identity Provider...</h2>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SSOSuccess;
