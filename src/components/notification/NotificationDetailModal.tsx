import React from "react";
import {
  Modal,
  Typography,
  Button,
  Spin,
  Tag,
  Space,
  Divider,
} from "antd";
import {
  ClockCircleOutlined,
  FileOutlined,
  DownloadOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { NotificationResponseDTO } from "@/api/notification";
import dayjs from "dayjs";
import DOMPurify from "dompurify";

const { Text, Title } = Typography;

interface NotificationDetailModalProps {
  notification: NotificationResponseDTO | null;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  visible,
  loading,
  onClose,
}) => {
  // Hiển thị định dạng đầy đủ cho chi tiết thông báo
  const formatFullDate = (dateString: string) => {
    if (!dateString) return "";
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };

  // Kiểm tra loại attachment
  const isImage = (url: string): boolean => {
    return !!url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  // Lấy tên file từ đường dẫn
  const getFileName = (url: string): string => {
    try {
      // Đầu tiên, xử lý URL để lấy tên file đầy đủ
      let fullFileName = "";
      
      // Bước 1: Tìm tên file từ các tham số URL
      const filenameMatch = url.match(/[^\/&=?]+\.(xlsx|xls|pdf|docx|doc|txt|csv|ppt|pptx|zip|rar|7z|tar|gz|jpg|jpeg|png|gif|webp)(?=[&?]|$)/i);
      if (filenameMatch) {
        fullFileName = decodeURIComponent(filenameMatch[0]);
      } else {
        // Bước 2: Tìm phần cuối URL (không có tham số)
        const urlWithoutParams = url.split('?')[0];
        const parts = urlWithoutParams.split('/');
        fullFileName = decodeURIComponent(parts[parts.length - 1]);
      }
      
      // Loại bỏ prefixes nếu tên file có format UUID hoặc prefix thư mục
      const cleanedFileName = fullFileName
        // Loại bỏ prefix đường dẫn thư mục (nếu có)
        .replace(/^.*[\/\\]/, '')
        // Loại bỏ UUID patterns (nếu có)
        .replace(/^[a-f0-9]{8,32}_[a-f0-9]{8,32}_/, '');
      
      // Rút gọn tên file nếu quá dài
      const MAX_FILENAME_LENGTH = 40;
      if (cleanedFileName.length > MAX_FILENAME_LENGTH) {
        const extension = cleanedFileName.split('.').pop() || '';
        const nameWithoutExt = cleanedFileName.substring(0, cleanedFileName.lastIndexOf('.'));
        
        // Giữ lại phần đầu, thêm ... và phần mở rộng
        return nameWithoutExt.substring(0, MAX_FILENAME_LENGTH - extension.length - 4) + 
               '...' + 
               '.' + extension;
      }
      
      return cleanedFileName || "attachment-file";
    } catch (error) {
      // Fallback đơn giản nếu có lỗi
      return "attachment-file";
    }
  };

  // Hàm sanitize HTML để đảm bảo an toàn trước khi render
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ol', 'ul', 'li', 'br', 'hr', 'a', 'img', 'blockquote', 'pre', 'code', 
                     'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'mark'],
      ALLOWED_ATTR: ['href', 'src', 'class', 'style', 'target', 'alt', 'width', 'height', 'data-text-align']
    });
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ 
        borderRadius: "12px", 
        overflow: "hidden",
        top: 20  // Giảm khoảng cách từ đỉnh trang
      }}
      bodyStyle={{ 
        padding: 0,
        maxHeight: "calc(100vh - 80px)", // Trừ đi khoảng cách top và bottom
        overflow: "hidden"
      }}
    >
      <div className="flex flex-col h-full" style={{ maxHeight: "calc(100vh - 80px)" }}>
        <div className="bg-white border-b p-6">
          <Title level={4} style={{ margin: 0 }}>
            {notification?.title}
          </Title>
          <div className="flex items-center mt-2 text-gray-500">
            <ClockCircleOutlined
              style={{ marginRight: "8px" }}
            />
            <Text type="secondary">
              {notification?.createdAt &&
                formatFullDate(notification.createdAt)}
            </Text>
          </div>
        </div>

        <Spin spinning={loading} tip="Loading details...">
          <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
            {notification?.content ? (
              <div 
                className="notification-content"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHTML(notification.content) 
                }}
                style={{ 
                  fontSize: "16px", 
                  lineHeight: "1.8",
                }}
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  This notification has no additional content.
                </Text>
              </div>
            )}

            {notification?.attachment && (
              <>
                {isImage(notification.attachment) ? (
                  <div className="mt-6">
                    <img
                      src={notification.attachment}
                      alt="Attachment"
                      className="max-w-full rounded-md border border-gray-100 shadow-sm"
                      style={{ maxHeight: "500px", objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <FileOutlined className="text-blue-500 mr-2 text-lg" />
                      <Text strong style={{ fontSize: "15px" }}>
                        {getFileName(notification.attachment)}
                      </Text>
                      <div className="flex-grow"></div>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        href={notification.attachment}
                        download
                        size="middle"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Spin>
        
        <div className="mt-auto">
          <Divider style={{ margin: "0" }} />
          
          <div className="p-4 flex justify-end">
            <Button size="middle" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* CSS cho nội dung Rich Text trong thông báo */}
      <style jsx global>{`
        .notification-content {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .notification-content h1, 
        .notification-content h2, 
        .notification-content h3, 
        .notification-content h4, 
        .notification-content h5, 
        .notification-content h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .notification-content h1 {
          font-size: 1.5em;
        }
        
        .notification-content h2 {
          font-size: 1.3em;
        }
        
        .notification-content h3 {
          font-size: 1.2em;
        }
        
        .notification-content p {
          margin-bottom: 1em;
        }
        
        .notification-content ul, 
        .notification-content ol {
          padding-left: 2em;
          margin-bottom: 1em;
        }
        
        .notification-content ul {
          list-style-type: disc;
        }
        
        .notification-content ol {
          list-style-type: decimal;
        }
        
        .notification-content li {
          margin-bottom: 0.5em;
        }
        
        .notification-content a {
          color: #1890ff;
          text-decoration: none;
        }
        
        .notification-content a:hover {
          text-decoration: underline;
        }
        
        .notification-content blockquote {
          border-left: 4px solid #d9d9d9;
          padding-left: 1em;
          margin-left: 0;
          color: #666;
        }
        
        .notification-content code {
          background-color: rgba(0, 0, 0, 0.06);
          border-radius: 3px;
          padding: 2px 4px;
          font-family: Consolas, Monaco, 'Andale Mono', monospace;
        }
        
        .notification-content pre {
          background-color: #f5f5f5;
          border-radius: 3px;
          padding: 16px;
          overflow: auto;
        }
        
        .notification-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
        }
        
        .notification-content th, 
        .notification-content td {
          border: 1px solid #d9d9d9;
          padding: 8px;
          text-align: left;
        }
        
        .notification-content th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        
        .notification-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        
        /* Highlight styles từ TipTap */
        .notification-content mark {
          background-color: #ffeb3b;
          padding: 0 2px;
          border-radius: 2px;
        }
        
        /* Text alignment từ TipTap */
        .notification-content [data-text-align="center"] {
          text-align: center;
        }
        
        .notification-content [data-text-align="right"] {
          text-align: right;
        }
        
        .notification-content [data-text-align="left"] {
          text-align: left;
        }
      `}</style>
    </Modal>
  );
}; 