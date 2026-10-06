"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { SITE_HOST } from "@/lib/site-url";
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
import React, { useEffect, useRef, useState } from "react";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the caret so an image or link lands where it was, even after the file
  // dialog or a text input has taken focus.
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const rememberSelection = () => {
    if (editor) {
      const { from, to } = editor.state.selection;
      savedSelection.current = { from, to };
    }
  };
  const restoreSelection = () => {
    const range = savedSelection.current;
    if (editor && range) {
      editor.chain().focus().setTextSelection(range).run();
    } else {
      editor?.chain().focus().run();
    }
  };

  const [showImageBar, setShowImageBar] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const openPanel = (kind: "image" | "link") => {
    rememberSelection();
    setUploadError("");
    setShowImageBar(kind === "image");
    setShowLinkBar(kind === "link");
  };

  const closePanels = () => {
    setShowImageBar(false);
    setShowLinkBar(false);
  };

  const insertImageUrl = () => {
    const url = imageUrl.trim();
    if (!url || !editor) return;
    restoreSelection();
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
    setShowImageBar(false);
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url || !editor) return;
    restoreSelection();
    const isExternal = url.startsWith("http") && !url.includes(SITE_HOST);
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink(
        isExternal
          ? { href: url, target: "_blank", rel: "noopener noreferrer" }
          : { href: url },
      )
      .run();
    setLinkUrl("");
    setShowLinkBar(false);
  };

  const uploadImage = async (file: File) => {
    if (!editor) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.url || data?.url;
      if (!url) throw new Error("No URL returned");
      restoreSelection();
      editor.chain().focus().setImage({ src: url }).run();
      setShowImageBar(false);
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError("Upload failed. Please try a different image.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadImage(file);
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
            onClick={() => openPanel("link")}
            className={`${iconButtonClass} ${
              showLinkBar || editor.isActive("link") ? activeIconClass : ""
            }`}
            title="Insert Link"
          >
            <LinkIcon
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          {/* Insert image (upload or URL) */}
          <button
            type="button"
            onClick={() => openPanel("image")}
            className={`${iconButtonClass} ${
              showImageBar ? activeIconClass : ""
            }`}
            title="Insert Image"
          >
            <ImageIcon
              className="w-[14px] h-[14px] text-brand-zinc-700"
              strokeWidth={2.5}
            />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

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

        {/* Link bar */}
        {showLinkBar && (
          <div className="border-b border-brand-gray-150 bg-brand-gray-25 px-[12px] py-[10px] flex flex-wrap items-center gap-[8px]">
            <input
              type="text"
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertLink();
                }
                if (e.key === "Escape") closePanels();
              }}
              placeholder="https://example.com"
              className="flex-1 min-w-[200px] rounded-[6px] border border-brand-gray-150 bg-white px-[10px] py-[6px] text-[13px] focus:outline-none focus:border-brand-orange-500"
            />
            <button
              type="button"
              onClick={insertLink}
              className="rounded-[6px] bg-brand-black-950 px-[12px] py-[6px] text-[13px] font-medium text-white hover:bg-brand-black-900"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={closePanels}
              className="rounded-[6px] px-[8px] py-[6px] text-[13px] text-brand-gray-600 hover:bg-brand-gray-100"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Image bar */}
        {showImageBar && (
          <div className="border-b border-brand-gray-150 bg-brand-gray-25 px-[12px] py-[10px] flex flex-col gap-[8px]">
            <div className="flex flex-wrap items-center gap-[8px]">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  rememberSelection();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-[6px] rounded-[6px] border border-brand-gray-150 bg-white px-[10px] py-[6px] text-[13px] font-medium text-brand-black-950 hover:bg-brand-gray-100 disabled:opacity-60"
              >
                <Upload className="w-[14px] h-[14px]" strokeWidth={2.5} />
                {uploading ? "Uploading…" : "Upload from computer"}
              </button>
              <span className="text-[12px] text-brand-gray-500">
                or paste an image URL
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[8px]">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertImageUrl();
                  }
                  if (e.key === "Escape") closePanels();
                }}
                placeholder="https://example.com/image.jpg"
                className="flex-1 min-w-[200px] rounded-[6px] border border-brand-gray-150 bg-white px-[10px] py-[6px] text-[13px] focus:outline-none focus:border-brand-orange-500"
              />
              <button
                type="button"
                onClick={insertImageUrl}
                className="rounded-[6px] bg-brand-black-950 px-[12px] py-[6px] text-[13px] font-medium text-white hover:bg-brand-black-900"
              >
                Insert
              </button>
              <button
                type="button"
                onClick={closePanels}
                className="rounded-[6px] px-[8px] py-[6px] text-[13px] text-brand-gray-600 hover:bg-brand-gray-100"
              >
                Cancel
              </button>
            </div>
            <p className="text-[12px] text-brand-gray-500">
              JPEG, PNG, GIF or WebP, up to 10&nbsp;MB.
            </p>
            {uploadError && (
              <p className="text-[12px] text-brand-red-700">{uploadError}</p>
            )}
          </div>
        )}

        {/* Editor Content */}
        <div className="bg-white px-[16px] py-[12px] min-h-[134px] relative resize-y overflow-auto tiptap-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
