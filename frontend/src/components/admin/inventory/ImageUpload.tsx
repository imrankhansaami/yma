"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface ImageUploadProps {
  images: (File | string)[];
  onImagesChange: (images: (File | string)[]) => void;
  maxImages?: number;
  title?: string;
  showImageNumbers?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  title = "Add Product Images",
  showImageNumbers = true,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Generate previews: use URL for strings, createObjectURL for Files
    const newPreviews = images.map((img) => {
      if (typeof img === "string") return img;
      return URL.createObjectURL(img);
    });
    setPreviews(newPreviews);

    // Cleanup function
    return () => {
      newPreviews.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxImages - images.length);
    const updatedImages = [...images, ...newFiles];
    onImagesChange(updatedImages);
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const renderUploadSlot = (isLarge: boolean, index: number) => {
    if (index >= maxImages) return null;

    const hasImage = index < images.length;
    const sizeClasses = isLarge ? "w-[380px] h-[384px]" : "w-full h-[188px]";
    
    return (
      <div
        key={index}
        className={`border border-dashed border-brand-gray-125 rounded-[8px] overflow-hidden relative ${sizeClasses} bg-brand-gray-25`}
        style={isLarge ? { flexShrink: 0 } : {}}
      >
        {showImageNumbers && (
          <div className="absolute top-[8px] left-[8px] z-10 rounded-[6px] bg-black/65 px-[8px] py-[2px]">
            <span className="text-[11px] font-semibold text-white">
              Image {index + 1}
            </span>
          </div>
        )}

        {hasImage && previews[index] ? (
          <>
            <Image
              src={previews[index]}
              alt={`Product image ${index + 1}`}
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-[7px] right-[7px] w-[32px] h-[32px] bg-white border border-brand-gray-260 rounded-[8px] flex items-center justify-center shadow-[0px_1px_2px_0px_var(--alpha-black-5)] hover:bg-brand-gray-110 transition-colors z-10"
            >
              <X className="w-[16px] h-[16px] text-brand-ink-950" />
            </button>
          </>
        ) : (
          <label
            className={`cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-brand-gray-50 transition-colors`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              multiple={maxImages > 1}
            />
            <div className="flex flex-col items-center gap-[6px]">
              <ImagePlus className="w-[32px] h-[32px] text-brand-gray-500" />
              <div className="bg-brand-indigo-50 px-[8px] py-[1.5px] rounded-[6px]">
                <span className="text-[12px] font-medium leading-[1.6] text-brand-blue-500">
                  {maxImages > 1 ? "Add Image" : "Upload Cover"}
                </span>
              </div>
            </div>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-[16px] rounded-[8px] shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)] flex flex-col gap-[16px]">
      <p className="text-[16px] font-medium leading-[1.5] text-brand-black-950">
        {title}
      </p>

      <div className="flex gap-[8px] w-full overflow-x-auto">
        {/* Large image slot - Index 0 */}
        {renderUploadSlot(true, 0)}

        {/* Small images grid - Indexes 1-4 */}
        {maxImages > 1 && (
          <div className="flex gap-[8px] flex-1">
            <div className="flex flex-col gap-[8px] flex-1">
              {renderUploadSlot(false, 1)}
              {renderUploadSlot(false, 2)}
            </div>
            <div className="flex flex-col gap-[8px] flex-1">
              {renderUploadSlot(false, 3)}
              {renderUploadSlot(false, 4)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
