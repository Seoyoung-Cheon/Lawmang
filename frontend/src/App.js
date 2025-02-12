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

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Chatbot />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/youtube" element={<Youtube />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/precedent" element={<Precedent />} />
          <Route path="/template" element={<Template />} />
          <Route path="/cardnews" element={<Cardnews />} />
          <Route path="/precedent/detail/:id" element={<Detail />} />
          <Route path="/cardnews/:id" element={<Cardnews />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
