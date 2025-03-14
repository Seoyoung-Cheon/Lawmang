import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 페이지 로드시 로컬 스토리지에서 토큰과 만료시간 확인
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    if (token && tokenExpiration && Date.now() < parseInt(tokenExpiration, 10)) {
      setIsLoggedIn(true);
    } else {
      // 만료된 토큰이면 삭제
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      setIsLoggedIn(false);
    }
  }, []);

  const login = (token) => {
    // 1시간 후 만료 (1시간 = 60 * 60 * 1000 ms)
    const expirationTime = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expirationTime);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};