"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Upload,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import "./textEditor.css";
import api from "@/api/api";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
}

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, error }) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "text-[14px] font-normal leading-[1.55] text-brand-black-950 focus:outline-none min-h-[118px] prose prose-sm max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const toggleHeading = (level: 1 | 2 | 3 | 4) => {
    if (editor) {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const insertLink = () => {
    if (editor) {
      const url = prompt("Enter URL:");
      if (url) {
        const isExternal =
          url.startsWith("http") && !url.includes("ymabouncycastles.uk");
        if (isExternal) {
          editor.chain().focus().setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
        } else {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImage = () => {
    if (editor) {
      const url = prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  const uploadImage = async (file: File) => {
    if (!editor) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.url || data?.url;
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed. Please try again.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
      e.target.value = "";
    }
  };

  if (!editor) {
    return null;
  }

  const iconButtonClass =
    "flex items-center justify-center w-[32px] h-[32px] rounded-[4px] hover:bg-brand-gray-260 transition-colors cursor-pointer";
  const activeIconClass = "bg-brand-zinc-300";

  return (
    <div className="flex flex-col gap-[6px] w-full">
      {error && (
        <p className="text-[14px] font-normal leading-[1.55] text-brand-red-700">
          {error}
        </p>
      )}

      <div className="border border-brand-gray-150 rounded-[8px] overflow-hidden">
        {/* Toolbar */}
        <div className="bg-brand-gray-25 border-b border-brand-gray-150 px-[12px] py-[8px] flex gap-[4px] items-center">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${iconButtonClass} ${
              editor.isActive("bold") ? activeIconClass : ""
            }`}
            title="Bold"
          >
            <Bold
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${iconButtonClass} ${
              editor.isActive("italic") ? activeIconClass : ""
            }`}
            title="Italic"
          >
            <Italic
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Heading 1 */}
          <button
            type="button"
            onClick={() => toggleHeading(1)}
            className={`${iconButtonClass} ${
              editor.isActive("heading", { level: 1 }) ? activeIconClass : ""
            }`}
            title="Heading 1 (20px medium)"
          >
            <span className="text-brand-zinc-700 font-bold text-[15px]">H</span>
          </button>

          {/* Heading 2 */}
          <button
            type="button"
            onClick={() => toggleHeading(2)}
            className={`${iconButtonClass} ${
              editor.isActive("heading", { level: 2 }) ? activeIconClass : ""
            }`}
            title="Heading 2 (18px medium)"
          >
            <span className="text-brand-zinc-700 font-bold text-[13px]">H</span>
          </button>

          {/* Heading 3 */}
          <button
            type="button"
            onClick={() => toggleHeading(3)}
            className={`${iconButtonClass} ${
              editor.isActive("heading", { level: 3 }) ? activeIconClass : ""
            }`}
            title="Heading 3"
          >
            <span className="text-brand-zinc-700 font-bold text-[11px]">H3</span>
          </button>

          {/* Heading 4 */}
          <button
            type="button"
            onClick={() => toggleHeading(4)}
            className={`${iconButtonClass} ${
              editor.isActive("heading", { level: 4 }) ? activeIconClass : ""
            }`}
            title="Heading 4"
          >
            <span className="text-brand-zinc-700 font-bold text-[10px]">H4</span>
          </button>

          {/* Quote */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${iconButtonClass} ${
              editor.isActive("blockquote") ? activeIconClass : ""
            }`}
            title="Quote"
          >
            <Quote
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={insertLink}
            className={`${iconButtonClass} ${
              editor.isActive("link") ? activeIconClass : ""
            }`}
            title="Insert Link"
          >
            <LinkIcon
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Image by URL */}
          <button
            type="button"
            onClick={insertImage}
            className={iconButtonClass}
            title="Insert Image by URL"
          >
            <ImageIcon
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Upload Image */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={iconButtonClass}
            title="Upload Image"
          >
            <Upload
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${iconButtonClass} ${
              editor.isActive("bulletList") ? activeIconClass : ""
            }`}
            title="Bullet List"
          >
            <List
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${iconButtonClass} ${
              editor.isActive("orderedList") ? activeIconClass : ""
            }`}
            title="Numbered List"
          >
            <ListOrdered
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Editor Content */}
        <div className="bg-white px-[16px] py-[12px] min-h-[134px] relative resize-y overflow-auto tiptap-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
