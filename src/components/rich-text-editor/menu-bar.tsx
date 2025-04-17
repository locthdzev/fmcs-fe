import React, { useCallback, useState } from "react";
import { Editor } from "@tiptap/react";
import { Button, Divider, Modal, Input, Form } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  HighlightOutlined,
  LinkOutlined,
} from "@ant-design/icons";

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const headingLevels = [1, 2, 3] as const;
  
  // State cho modal link
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [needsLinkText, setNeedsLinkText] = useState(false);

  const setLink = useCallback(() => {
    if (!editor) return;

    // Get the current selected text
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '');

    // Check if there's already a link at the current position
    const currentLink = editor.getAttributes('link').href;
    
    // Mở modal thay vì dùng window.prompt
    setLinkUrl(currentLink || '');
    setNeedsLinkText(!text && !currentLink);
    setLinkText('');
    setLinkModalVisible(true);
  }, [editor]);

  // Xử lý khi người dùng xác nhận link trong modal
  const handleLinkConfirm = () => {
    if (!editor) return;
    
    // Empty
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkModalVisible(false);
      return;
    }

    // If no text is selected and user provided link text
    if (needsLinkText && linkText) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
        .run();
    } else {
      // Update link on selected text
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    
    setLinkModalVisible(false);
  };

  // Xử lý khi người dùng hủy
  const handleLinkCancel = () => {
    setLinkModalVisible(false);
  };

  return (
    <div className="border border-gray-300 rounded-md p-2 mb-1 bg-gray-50 flex flex-wrap gap-1">
      {/* Heading buttons */}
      {headingLevels.map((level) => (
        <Button
          key={`heading-${level}`}
          type={editor.isActive("heading", { level }) ? "primary" : "default"}
          size="small"
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </Button>
      ))}

      <Divider type="vertical" />

      {/* Text formatting */}
      <Button
        type={editor.isActive("bold") ? "primary" : "default"}
        size="small"
        icon={<BoldOutlined />}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Button
        type={editor.isActive("italic") ? "primary" : "default"}
        size="small"
        icon={<ItalicOutlined />}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Button
        type={editor.isActive("strike") ? "primary" : "default"}
        size="small"
        icon={<StrikethroughOutlined />}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <Divider type="vertical" />

      {/* Link */}
      <Button
        type={editor.isActive("link") ? "primary" : "default"}
        size="small"
        icon={<LinkOutlined />}
        onClick={setLink}
      />

      <Divider type="vertical" />

      {/* Text alignment */}
      <Button
        type={editor.isActive({ textAlign: "left" }) ? "primary" : "default"}
        size="small"
        icon={<AlignLeftOutlined />}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      />
      <Button
        type={editor.isActive({ textAlign: "center" }) ? "primary" : "default"}
        size="small"
        icon={<AlignCenterOutlined />}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      />
      <Button
        type={editor.isActive({ textAlign: "right" }) ? "primary" : "default"}
        size="small"
        icon={<AlignRightOutlined />}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      />

      <Divider type="vertical" />

      {/* Lists */}
      <Button
        type={editor.isActive("bulletList") ? "primary" : "default"}
        size="small"
        icon={<UnorderedListOutlined />}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Button
        type={editor.isActive("orderedList") ? "primary" : "default"}
        size="small"
        icon={<OrderedListOutlined />}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <Divider type="vertical" />

      {/* Highlight */}
      <Button
        type={editor.isActive("highlight") ? "primary" : "default"}
        size="small"
        icon={<HighlightOutlined />}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />

      {/* Modal for link input */}
      <Modal
        title="Thêm liên kết"
        open={linkModalVisible}
        onOk={handleLinkConfirm}
        onCancel={handleLinkCancel}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="URL liên kết">
            <Input 
              placeholder="Nhập URL (ví dụ: https://example.com)" 
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              autoFocus
            />
          </Form.Item>
          
          {needsLinkText && (
            <Form.Item label="Văn bản hiển thị">
              <Input 
                placeholder="Nhập văn bản hiển thị cho liên kết" 
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MenuBar; 