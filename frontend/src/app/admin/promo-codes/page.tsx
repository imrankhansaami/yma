"use client";

import { PromoCodesTable } from "@/components/admin/promo-codes/PromoCodesTable";
import { CreatePromoCodeModal } from "@/components/admin/promo-codes/CreatePromoCodeModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

const PromoCodesPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen space-y-5 py-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-brand-black-950">
            Available Promo Codes
          </h1>
          <p className="text-sm text-brand-gray-500">
            Create, manage, and monitor promo codes for customer bookings.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="h-10 rounded-lg bg-brand-orange-650 px-4 text-sm font-medium text-white shadow-none hover:bg-brand-orange-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Promo Code
        </Button>
      </div>

      <PromoCodesTable refreshKey={refreshKey} />
      <CreatePromoCodeModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};

export default PromoCodesPage;
