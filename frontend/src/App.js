import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./Home/Header";
import Main from "./Home/Main";
import Youtube from "./Home/Youtube";
import Chatbot from "./chatbot/Chatbot";
import Consultation from "./components/Consultation/Consultation";
import Precedent from "./components/Precedent/Precedent";
import Template from "./components/Template/Template";
import Detail from "./components/Precedent/Detail";
import Cardnews from "./Home/Cardnews";
import FAQ from "./Home/FAQ";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Footer from "./Home/Footer";
import { AuthProvider } from "./components/Auth/AuthContext";
import Mypage from "./components/Mypage/Mypage";

// 로그인, 회원가입 화면에서는 푸터 숨김
function AppContent() {
  const location = useLocation();
  const hideFooter = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Chatbot />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/youtube" element={<Youtube />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/precedent" element={<Precedent />} />
          <Route path="/template" element={<Template />} />
          <Route path="/template/:category" element={<Template />} />
          <Route path="/cardnews" element={<Cardnews />} />
          <Route path="/precedent/detail/:id" element={<Detail />} />
          <Route path="/cardnews/:id" element={<Cardnews />} />
          <Route path="/faq/:id" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/mypage" element={<Mypage />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
