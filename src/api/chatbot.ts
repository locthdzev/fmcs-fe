import { rasaInstance } from "./customize-axios";

interface ChatResponse {
  text: string;
}

export const sendMessageToChatbot = async (
  message: string
): Promise<string[]> => {
  try {
    const response = await rasaInstance.post<ChatResponse[]>(
      "/webhooks/rest/webhook",
      {
        sender: "user",
        message,
      }
    );
    console.log("Rasa Response:", response.data);
    return response.data && response.data.length > 0
      ? response.data.map((d) => d.text)
      : ["Bot không có phản hồi, thử lại nhé!"];
  } catch (error) {
    console.error("Chatbot error:", error);
    return ["Có lỗi xảy ra, thử lại sau!"];
  }
};
