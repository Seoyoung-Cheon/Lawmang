import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <div className="App flex flex-col min-h-screen">
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
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
