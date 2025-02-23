import { useState } from "react";
import { useChatbot } from "@/context/ChatbotContext";
import { sendMessageToChatbot } from "@/api/chatbot";
import { FaTimes } from "react-icons/fa";
import { BsRobot, BsSend } from "react-icons/bs";

const Chatbot: React.FC = () => {
  const { message, responses, setMessage, addResponse } = useChatbot();
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const botResponse = await sendMessageToChatbot(message);
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    addResponse(`${message}|${timestamp}`, `${botResponse}|${timestamp}`);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Icon chatbot */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
          aria-label="Mở chatbot"
        >
          <BsRobot size={24} />
        </button>
      )}

      {/* Form chat */}
      {isOpen && (
        <div
          className="w-80 bg-white rounded-lg flex flex-col"
          style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <BsRobot size={20} className="text-white" />
              <h3 className="text-lg font-semibold text-white">Chatbot FMCS</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-red-300 transition"
              aria-label="Đóng chatbot"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Tin nhắn */}
          <div className="h-96 overflow-y-auto bg-gray-50 rounded-md p-3">
            {responses.map((r, idx) => {
              const [userMsg, userTime] = r.user.split("|");
              const [botMsg, botTime] = r.bot.split("|");
              return (
                <div key={idx} className="mb-2">
                  {userMsg && (
                    <div className="flex flex-col items-end">
                      <p className="text-blue-600 bg-blue-100 rounded-lg px-3 py-1 inline-block max-w-[80%]">
                        <span className="font-semibold">Bạn:</span> {userMsg}
                      </p>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {userTime}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col items-start mt-1">
                    <p className="text-gray-800 bg-white rounded-lg px-3 py-1 inline-block max-w-[80%] shadow-sm">
                      <span className="font-semibold">Bot:</span> {botMsg}
                    </p>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {botTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input và nút gửi */}
          <div className="flex items-center border-t p-2 bg-white">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              placeholder="Nhập câu hỏi..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Gửi tin nhắn"
            >
              <BsSend size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
