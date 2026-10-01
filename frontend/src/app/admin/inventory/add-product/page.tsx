"use client";

import AddProductForm from "@/components/admin/inventory/AddProductForm";
import { AddProductFormData } from "@/lib/validation/addProductSchema";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddProductPage() {
  const router = useRouter();
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  const handleSubmit = async (data: AddProductFormData) => {
    // Logic is now handled inside AddProductForm component using TanStack Query
    console.log("Form submission triggered:", data);
  };

  const handleBack = () => {
    router.push("/admin/inventory");
  };

  return (
    <div className="flex flex-col gap-[16px] w-full py-[16px]">
      {/* Header with buttons */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={handleBack}
          className="bg-white border border-brand-gray-260 h-[36px] px-[16px] py-[8px] rounded-[8px] shadow-[0px_1px_2px_0px_var(--alpha-black-5)] flex items-center gap-[8px] hover:bg-brand-gray-110 transition-colors"
        >
          <ArrowLeft className="w-[16px] h-[16px] text-brand-ink-950" />
          <span className="text-[14px] font-medium leading-[20px] text-brand-ink-950">
            Add Products
          </span>
        </button>

        <button
          type="submit"
          form="add-product-form"
          disabled={isSavingChanges}
          className="bg-brand-orange-500 h-[36px] px-[16px] py-[8px] rounded-[8px] flex items-center gap-[8px] hover:bg-brand-orange-530 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageCheck className="w-[16px] h-[16px] text-brand-gray-50" />
          <span className="text-[14px] font-medium leading-[20px] text-brand-gray-50">
            {isSavingChanges ? "Saving..." : "Save Changes"}
          </span>
        </button>
      </div>

      {/* Form */}
      <AddProductForm onSubmit={handleSubmit} onSubmittingChange={setIsSavingChanges} />
    </div>
  );
}
