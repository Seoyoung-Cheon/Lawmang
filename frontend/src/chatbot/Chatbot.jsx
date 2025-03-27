import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/slices/authSlice";
import Logo from "../assets/icon-180.png";
import axios from "axios";
import { IoIosSend } from "react-icons/io";
import { IoMdPause } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";

const Chatbot = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [generalMessages, setGeneralMessages] = useState([
    {
      text: "안녕하세요! 당신의 법률 파트너, 로망입니다 :)",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [legalMessages, setLegalMessages] = useState([
    {
      text: "법률 용어의 풀이가 궁금하다면 검색해보세요 :)",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 로그인 상태 변경 감지하여 법률상담 버튼 비활성화
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedCategory("general");
    }
  }, [isAuthenticated]);

  // messages 상태가 변경될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    const chatContainer = document.querySelector(".messages-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [generalMessages, legalMessages]);

  // 카테고리 변경 시 초기 메시지 유지를 위한 useEffect
  useEffect(() => {
    if (generalMessages.length === 0) {
      setGeneralMessages([
        {
          text: "안녕하세요! 당신의 법률 파트너, 로망입니다 :)",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
    if (legalMessages.length === 0) {
      setLegalMessages([
        {
          text: "법률 용어의 풀이가 궁금하다면 검색해보세요 :)",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [selectedCategory, generalMessages.length, legalMessages.length]);

  const handleCategoryClick = (category) => {
    if (category === "legal" && !isAuthenticated) {
      setShowLoginPopup(true);
      return;
    }
    setSelectedCategory(category);
  };

  const handleLoginClick = () => {
    setShowLoginPopup(false);
    navigate("/login");
  };

  // messages 상태 제거하고 카테고리에 따라 메시지 선택
  const currentMessages =
    selectedCategory === "general" ? generalMessages : legalMessages;
  const setCurrentMessages =
    selectedCategory === "general" ? setGeneralMessages : setLegalMessages;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // 사용자 메시지 추가
    const userMessage = {
      text: userInput,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    // 현재 카테고리의 메시지 배열에 추가
    setCurrentMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsTyping(true);

    if (selectedCategory === "general") {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/chatbot/search",
          {
            query: userInput,
          }
        );

        setIsTyping(false);
        const finalAnswer = response.data.data.final_answer;

        const botMessage = {
          text: "",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
        };

        setGeneralMessages((prev) => [...prev, botMessage]);

        let index = 0;
        const timer = setInterval(() => {
          if (index < finalAnswer.length) {
            setGeneralMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                text: finalAnswer.slice(0, index + 1),
              };
              return updated;
            });
            index++;
          } else {
            clearInterval(timer);
          }
        }, 20);
      } catch (error) {
        setIsTyping(false);
        console.error("API Error:", error);
        const errorMessage = {
          text: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
        };
        setGeneralMessages((prev) => [...prev, errorMessage]);
      }
    } else if (selectedCategory === "legal") {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/chatbot_term/legal-term",
          {
            question: userInput,
          }
        );

        setIsTyping(false);
        const result = response.data.result;

        const botMessage = {
          text: "",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
        };

        setLegalMessages((prev) => [...prev, botMessage]);

        let index = 0;
        const timer = setInterval(() => {
          if (index < result.length) {
            setLegalMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                text: result.slice(0, index + 1),
              };
              return updated;
            });
            index++;
          } else {
            clearInterval(timer);
          }
        }, 20);
      } catch (error) {
        setIsTyping(false);
        console.error("API Error:", error);
        const errorMessage = {
          text: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
        };
        setLegalMessages((prev) => [...prev, errorMessage]);
      }
    }
  };

  return (
    <div>
      {/* ===================== 데스크톱 버전 챗봇 ===================== */}
      <div
        className={`${
          isOpen ? "block max-[1380px]:block" : "hidden max-[1380px]:hidden"
        } min-[1380px]:block fixed right-[100px] 2xl:right-[170px] top-[55%] -translate-y-1/2 z-40`}
      >
        <div className="w-[500px] h-[600px] 2xl:w-[600px] 2xl:h-[770px] bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.2)] flex flex-col relative">
          {showLoginPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-2xl">
                <p className="text-center text-lg mb-6">
                  법률용어 검색은 로그인이 필요합니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLoginPopup(false)}
                    className="flex-1 bg-gray-200 py-2 rounded-lg"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleLoginClick}
                    className="flex-1 bg-Main text-white py-2 rounded-lg"
                  >
                    로그인
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-Main text-white rounded-t-xl">
            <h3 className="text-2xl  font-['Oswald']">Lawmang 챗봇</h3>
          </div>

          <div className="flex justify-between p-4 border-b">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleCategoryClick("general")}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === "general"
                    ? "bg-Main text-white"
                    : "bg-gray-100"
                }`}
              >
                법률상담
              </button>

              <button
                onClick={() => handleCategoryClick("legal")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === "legal"
                    ? "bg-Main text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "로그인이 필요합니다" : ""}
              >
                법률용어
              </button>
              {selectedCategory === "general" && (
                <p className="text-xs 2xl:text-sm text-gray-500 ml-4 max-w-[200px] self-center">
                  ※ '법률용어' 풀이가 필요한 경우
                  <br />
                  로그인 후 이용 가능합니다.
                </p>
              )}
            </div>
          </div>

          {/* 챗봇 메시지 영역 */}
          <div className="messages-container flex-1 py-6 pr-6 pl-0 overflow-y-auto">
            {currentMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.isUser
                    ? "flex justify-end pr-0"
                    : "flex items-start gap-4 pl-4"
                }`}
              >
                {/* 챗봇 프로필 이미지 */}
                {!msg.isUser && (
                  <img
                    src={Logo}
                    alt="Lawmang 로고"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 sticky top-0"
                  />
                )}
                <div
                  className={`${
                    msg.isUser
                      ? "bg-[#a7a28f] text-white relative before:content-[''] before:absolute before:right-0 before:top-4 before:translate-x-[99%] before:border-y-[5px] before:border-r-0 before:border-l-[8px] before:border-transparent before:border-l-[#a7a28f]"
                      : "bg-gray-200 text-black relative before:content-[''] before:absolute before:left-0 before:top-4 before:-translate-x-[99%] before:border-y-[5px] before:border-l-0 before:border-r-[8px] before:border-transparent before:border-r-gray-200"
                  } px-4 py-2 rounded-xl max-w-[80%] relative break-words`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-4 mb-4 pl-4">
                <img
                  src={Logo}
                  alt="Lawmang 로고"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 sticky top-0"
                />
                <div className="bg-gray-200 px-5 py-4 rounded-xl relative before:content-[''] before:absolute before:left-0 before:top-4 before:translate-x-[-98%] before:border-8 before:border-transparent before:border-r-gray-200">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 입력창 */}
          <div className="p-6 border-t bg-gray-100 flex gap-3 rounded-b-xl">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isTyping) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="flex-1 p-2 border rounded-xl focus:outline-none focus:border-Main"
              placeholder="메시지를 입력하세요..."
              disabled={isTyping}
            />
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 ${
                isTyping
                  ? "bg-gray-400 cursor-default"
                  : "bg-Main hover:bg-Main_hover"
              } text-white rounded-xl transition-colors flex flex-col items-center justify-center gap-0.5 group`}
              disabled={isTyping}
            >
              {isTyping ? (
                <div className="relative">
                  <IoMdPause className="w-5 h-5 animate-pulse" />
                  <div className="absolute -inset-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <IoIosSend className="w-8 h-6 group-hover:animate-bounce-diagonal" />
              )}
            </button>
          </div>

          {/* 1380px 이하에서 닫기 버튼 */}
          <div className="max-[1380px]:block hidden absolute top-5 right-4 hover:bg-Main_hover transition-colors rounded-full">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full text-white"
            >
              <IoIosArrowDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 챗봇 아이콘 ===================== */}
      <div
        className={`${
          isOpen ? "hidden max-[1380px]:hidden" : "hidden max-[1380px]:block"
        } min-[1380px]:hidden fixed right-4 lg:right-10 bottom-6 z-40`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-Main text-white rounded-full shadow-lg flex items-center justify-center hover:bg-Main_hover transition-colors relative group"
        >
          {/* 챗봇 아이콘 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8"
          >
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>

          {/* 툴팁 */}
          <div className="absolute bottom-16 right-0 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            챗봇 열기
          </div>
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
