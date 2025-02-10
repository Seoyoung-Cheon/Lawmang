import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./Home/Header";
import Main from "./Home/Main";
import Youtube from "./Home/Youtube";
import Chatbot from "./chatbot/Chatbot";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Chatbot />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/youtube" element={<Youtube />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
