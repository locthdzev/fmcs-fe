import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useChatbot } from "@/context/ChatbotContext";
import { sendMessageToChatbot } from "@/api/chatbot";
import { FaTimes } from "react-icons/fa";
import { BsRobot, BsSend } from "react-icons/bs";
import { BiLoaderAlt } from "react-icons/bi";

const Chatbot: React.FC = () => {
  const { message, responses, setMessage, addResponse } = useChatbot();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const randomThoughts = [
    "Chào bạn, hỏi mình gì đi!",
    "Hello, bạn khỏe không?",
    "Hôm nay bạn thế nào?",
    "Mình có thể giúp gì cho bạn?",
    "Chào, đừng ngại hỏi mình nhé!",
  ];

  const [thought, setThought] = useState(randomThoughts[0]);
  const [isThoughtVisible, setIsThoughtVisible] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setIsThoughtVisible(false);
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * randomThoughts.length);
          setThought(randomThoughts[randomIndex]);
          setIsThoughtVisible(true);
        }, 2000);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleCloseChatbot = () => {
    setIsOpen(false);
    setIsThoughtVisible(true);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    addResponse(`${message}|${timestamp}`, "");

    const botResponses = await sendMessageToChatbot(message);
    botResponses.forEach((botResponse, index) => {
      setTimeout(() => {
        addResponse("", `${botResponse}|${timestamp}`);
        if (index === botResponses.length - 1) setIsLoading(false);
      }, index * 500);
    });

    setMessage("");
  };

  const renderBotMessage = (botMsg: string) => {
    const parts = botMsg.split("\n");
    const scheduleLines = parts.filter((line) => line.startsWith("-"));
    const introText = parts.filter(
      (line) => !line.startsWith("-") && !line.match(/\[.*\]\(.*\)/)
    );
    const linkMatch = botMsg.match(/\[([^\]]+)\]\(([^)]+)\)/);

    return (
      <div className="flex flex-col gap-2">
        {introText.map((text, idx) => (
          <p key={idx} className="text-gray-800">
            {text}
          </p>
        ))}
        {scheduleLines.length > 0 && (
          <ul className="list-disc pl-5 text-gray-800">
            {scheduleLines.map((line, idx) => (
              <li key={idx} className="mb-1">
                {line.substring(2).trim()}
              </li>
            ))}
          </ul>
        )}
        {linkMatch && (
          <button
            onClick={() => router.push(linkMatch[2])}
            className="text-blue-500 hover:underline mt-2 inline-block bg-blue-100 px-2 py-1 rounded-md cursor-pointer"
          >
            {linkMatch[1]}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative flex items-center">
            {isThoughtVisible && (
              <div
                style={{
                  position: "absolute",
                  right: "4rem",
                  background: "linear-gradient(135deg, #ff9800, #ff5722)",
                  color: "white",
                  fontSize: "0.875rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "15px / 10px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                  width: "max-content",
                  minWidth: "200px",
                  maxWidth: "300px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  animation: "fadeIn 0.5s ease-in-out",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    animation: "slideText 15s linear infinite",
                  }}
                >
                  {thought}
                </span>
                <div
                  style={{
                    position: "absolute",
                    right: "-0.8rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderTop: "0.8rem solid transparent",
                    borderBottom: "0.8rem solid transparent",
                    borderLeft: "0.8rem solid #ff5722",
                  }}
                />
              </div>
            )}
            <button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
              aria-label="Mở chatbot"
            >
              <BsRobot size={24} />
            </button>
          </div>
        )}
        {isOpen && (
          <div
            style={{
              width: "24rem",
              backgroundColor: "white",
              borderRadius: "0.75rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "rgba(0, 0, 0, 0.2) 0px 10px 30px",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div className="flex justify-between items-center bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-t-xl">
              <div className="flex items-center gap-2">
                <BsRobot size={20} className="text-white animate-pulse" />
                <h3 className="text-lg font-bold text-white">Chatbot FMCS</h3>
              </div>
              <button
                onClick={handleCloseChatbot}
                className="text-white hover:text-red-200 transition-transform hover:scale-110"
                aria-label="Đóng chatbot"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="h-[400px] overflow-y-auto bg-gray-50 p-4 flex flex-col gap-4">
              {responses.map((r, idx) => {
                const [userMsg, userTime] = r.user.split("|");
                const [botMsg, botTime] = r.bot.split("|");
                return (
                  <div key={idx} className="flex flex-col gap-3">
                    {userMsg && (
                      <div className="flex flex-col items-end">
                        <p className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-[75%] shadow-md break-words">
                          {userMsg}
                        </p>
                        <span className="text-xs text-gray-500 mt-1">
                          {userTime}
                        </span>
                      </div>
                    )}
                    {botMsg && (
                      <div className="flex flex-col items-start">
                        <div className="bg-white rounded-2xl px-4 py-2 max-w-[75%] shadow-md border border-gray-200 break-words">
                          {renderBotMessage(botMsg)}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {botTime}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <BiLoaderAlt className="animate-spin" size={20} />
                  <span>Đang xử lý...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center border-t p-3 bg-white rounded-b-xl">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-gray-50"
                placeholder="Nhập câu hỏi..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="ml-3 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-all duration-200 disabled:bg-gray-400"
                disabled={isLoading}
                aria-label="Gửi tin nhắn"
              >
                <BsSend size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideText {
              0% { transform: translateX(100%); }
              10% { transform: translateX(0); }
              90% { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }
            @keyframes slideUp {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
    </>
  );
};

export default Chatbot;
