import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Provider } from "react-redux"; // ✅ Redux Provider 추가
import { store } from "./redux/store"; // ✅ Redux Store 불러오기
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

import ConsDetail from "./components/Consultation/ConsDetail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ResetPassword from "./components/Auth/ResetPwd";
import Modify from "./components/Auth/Modify";
import ViewedList from "./components/MyLog/ViewedList";
import MemoBoard from "./components/MyLog/MemoBoard";
import MyLogsPage from "./components/MyLog/MyLogsPage";
import ChatbotTest from "./chatbot/Chatbot_test/Chatbot_test";
import Dictionary from "./components/Dictionary/Dictionary";

// ✅ QueryClient 인스턴스 생성
const queryClient = new QueryClient();

// ScrollToTop 컴포넌트 추가
function ScrollToTop() {
  const { pathname } = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 전역 이벤트 리스너 설정
  useEffect(() => {
    const handleCustomEvent = (e) => {
      setIsModalOpen(e.detail.isOpen);
      if (e.detail.isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    };

    window.addEventListener("modalStateChange", handleCustomEvent);

    return () => {
      window.removeEventListener("modalStateChange", handleCustomEvent);
      document.body.style.overflow = "unset";
    };
  }, []);

  // 페이지 이동 시 스크롤 처리
  useEffect(() => {
    if (!isModalOpen) {
      window.scrollTo(0, 0);
    }
  }, [pathname, isModalOpen]);

  return null;
}

// ✅ 로그인, 회원가입 화면에서는 푸터 숨김
function AppContent() {
  const location = useLocation();
  const hideFooter = ["/login", "/signup", "/modify"].includes(
    location.pathname
  );

  // 챗봇을 숨길 경로 추가
  const hideChatbot = [
    "/login",
    "/signup",
    "/reset-password",
    "/modify",
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      {!hideChatbot && <Chatbot />}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/youtube" element={<Youtube />} />
          <Route path="/chatbot-test" element={<ChatbotTest />} />
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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/modify" element={<Modify />} />
          <Route path="/consultation/detail/:id" element={<ConsDetail />} />
          <Route path="/mylog" element={<MyLogsPage />} />
          <Route path="/mylog/viewed" element={<ViewedList />} />
          <Route path="/mylog/memo" element={<MemoBoard />} />
          <Route path="/mylog/logs" element={<MyLogsPage />} />
          <Route path="/dictionary" element={<Dictionary />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}

// ✅ Redux Provider 추가
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          {" "}
          {/* Redux Store 적용 */}
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
