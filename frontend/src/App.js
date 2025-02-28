import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
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
import Mypage from "./components/Mypage/Mypage";
import ConsDetail from "./components/Consultation/ConsDetail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./redux/slices/authSlice";
import ResetPassword from "./components/Auth/ResetPwd";
import Modify from "./components/Auth/Modify";

// ✅ QueryClient 인스턴스 생성
const queryClient = new QueryClient();

// ✅ 로그인, 회원가입 화면에서는 푸터 숨김
function AppContent() {
  const location = useLocation();
  const hideFooter = ["/login", "/signup"].includes(location.pathname);
  // 챗봇을 숨길 경로 추가
  const hideChatbot = [
    "/login",
    "/signup",
    "/reset-password",
    "/modify",
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {!hideChatbot && <Chatbot />}
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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/mypage"
            element={
              <PrivateRoute>
                <Mypage />
              </PrivateRoute>
            }
          />
          <Route
            path="/modify"
            element={
              <PrivateRoute>
                <Modify />
              </PrivateRoute>
            }
          />
          <Route path="/consultation/detail/:id" element={<ConsDetail />} />
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

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default App;
