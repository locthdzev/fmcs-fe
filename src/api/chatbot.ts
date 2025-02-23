import { rasaInstance } from "./customize-axios";

interface ChatResponse {
  text: string;
}

export const sendMessageToChatbot = async (
  message: string
): Promise<string> => {
  try {
    const response = await rasaInstance.post<ChatResponse[]>(
      "/webhooks/rest/webhook",
      {
        sender: "user",
        message,
      }
    );
    return response.data[0]?.text || "Tôi chưa hiểu, thử lại nhé!";
  } catch (error) {
    console.error("Chatbot error:", error);
    return "Có lỗi xảy ra, thử lại sau!";
  }
};
