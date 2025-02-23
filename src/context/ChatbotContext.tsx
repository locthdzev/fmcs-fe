import { createContext, useContext, useState, ReactNode } from "react";

interface ChatbotState {
  message: string;
  responses: { user: string; bot: string }[];
  setMessage: (msg: string) => void;
  addResponse: (userMsg: string, botMsg: string) => void;
}

const ChatbotContext = createContext<ChatbotState | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState<{ user: string; bot: string }[]>([
    {
      user: "",
      bot: "Xin chào! Hỏi tôi về đặt lịch khám hoặc cách dùng FMCS nhé!",
    },
  ]);

  const addResponse = (userMsg: string, botMsg: string) => {
    setResponses((prev) => [...prev, { user: userMsg, bot: botMsg }]);
  };

  return (
    <ChatbotContext.Provider
      value={{ message, responses, setMessage, addResponse }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
};
