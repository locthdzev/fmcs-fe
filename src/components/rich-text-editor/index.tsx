import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import MenuBar from "./menu-bar";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-3",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "min-h-[156px] border border-gray-300 rounded-md bg-white py-2 px-3",
        style: "outline: none;"
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="rich-text-editor">
      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          min-height: 156px;
          outline: none;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1rem;
        }
        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1rem;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror [data-text-align="center"] {
          text-align: center;
        }
        .rich-text-editor .ProseMirror [data-text-align="right"] {
          text-align: right;
        }
        .rich-text-editor .ProseMirror mark {
          background-color: #ffeb3b;
        }
      `}</style>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor; 