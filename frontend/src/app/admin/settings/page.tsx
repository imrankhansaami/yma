"use client";

import api from "@/api/api";
import { useAdminToast } from "@/components/ui/admin-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectUser, useAuthStore } from "@/store/useAuthStore";
import { Upload, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type TabType = "profile" | "admin-access";

const AdminSettingsPage = () => {
  const [activeTab] = useState<TabType>("profile");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [remotePhotoUrl, setRemotePhotoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const user = useAuthStore(selectUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const { notify } = useAdminToast();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!user) return;
    const nextFirstName = user.name?.split(" ")?.[0] ?? "";
    const nextLastName = user.name?.split(" ")?.slice(1).join(" ") ?? "";
    setFormValues((prev) => ({
      firstName: prev.firstName || nextFirstName,
      lastName: prev.lastName || nextLastName,
      email: prev.email || user.email || "",
    }));
    setRemotePhotoUrl((prev) => prev ?? user.photo ?? null);
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setRemovePhoto(false);
    void updateProfile({ file, removePhoto: false });
  };

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setRemotePhotoUrl(null);
    setRemovePhoto(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const updateProfile = async ({
    file,
    removePhoto: shouldRemovePhoto,
  }: {
    file?: File | null;
    removePhoto?: boolean;
  } = {}) => {
    try {
      setIsSaving(true);
      const payload = new FormData();
      payload.append("firstName", formValues.firstName.trim());
      payload.append("lastName", formValues.lastName.trim());
      const nextFile = file ?? selectedFile;
      if (nextFile) {
        payload.append("photo", nextFile);
      }
      if (shouldRemovePhoto ?? removePhoto) {
        payload.append("removePhoto", "true");
      }
      const { data } = await api.put("/admin/settings", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = data?.data?.user ?? data?.data ?? data ?? {};
      setFormValues({
        firstName: updated.firstName ?? formValues.firstName,
        lastName: updated.lastName ?? formValues.lastName,
        email: updated.email ?? formValues.email,
      });
      const nextPhoto = updated.photo ?? updated.avatar ?? null;
      setRemotePhotoUrl(nextPhoto);
      updateUser({
        name:
          updated.name ??
          `${updated.firstName ?? formValues.firstName} ${
            updated.lastName ?? formValues.lastName
          }`.trim(),
        photo: nextPhoto ?? undefined,
      });
      setRemovePhoto(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      notify({
        title: "Profile updated",
        message: "Your profile settings were saved successfully.",
      });
    } catch {
      notify({
        title: "Update failed",
        message: "We could not save your changes. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfile();
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Main Content */}
      <div className="max-w-4xl pb-12 pt-4">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Manage Profile
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Create, manage, and publish blogs for YMA Bouncy Castle website.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white">
              <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
                <h2 className="font-semibold text-gray-900">
                  Profile Information
                </h2>

                {isLoading && (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-20 w-20 rounded-full bg-gray-100" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="h-11 rounded-md bg-gray-100" />
                      <div className="h-11 rounded-md bg-gray-100" />
                    </div>
                    <div className="h-11 rounded-md bg-gray-100" />
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <label className="relative inline-flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={handleFileChange}
                        disabled={isLoading || isSaving}
                      />
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                        {previewUrl || remotePhotoUrl ? (
                          <Image
                            src={previewUrl ?? remotePhotoUrl ?? ""}
                            alt="Profile preview"
                            fill
                            className="pointer-events-none rounded-full object-cover"
                          />
                        ) : (
                          <UserRound className="pointer-events-none h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <span className="pointer-events-none absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-520 text-white shadow-sm">
                        <Upload className="h-4 w-4" />
                      </span>
                    </label>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Profile Image
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or GIF - Max file size 2MB
                      </p>
                      <Button
                        variant="outline"
                        className=" border-gray-200 text-xs font-medium text-brand-zinc-400 shadow-none hover:bg-gray-100"
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isLoading || isSaving}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="first-name"
                        className="text-sm font-medium text-gray-700"
                      >
                        First name
                      </label>
                      <Input
                        id="first-name"
                        name="firstName"
                        value={formValues.firstName}
                        onChange={handleInputChange}
                        disabled={isLoading || isSaving}
                        className="h-11 border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="last-name"
                        className="text-sm font-medium text-gray-700"
                      >
                        Last name
                      </label>
                      <Input
                        id="last-name"
                        name="lastName"
                        value={formValues.lastName}
                        onChange={handleInputChange}
                        disabled={isLoading || isSaving}
                        className="h-11 border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                      disabled
                      className="h-11 border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      className="h-11 rounded-md bg-brand-orange-520 px-5 text-base font-semibold text-white shadow-none hover:bg-brand-orange-520/90"
                      disabled={isLoading || isSaving}
                      type="submit"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-6 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Log Out
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    You&apos;ll need to sign in again to continue.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-gray-200 px-5 text-sm font-semibold text-gray-900 shadow-none hover:bg-gray-50"
                  onClick={() => logout()}
                >
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin-access" && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white/80 px-6 py-10 text-center text-sm text-gray-500">
            Admin Access settings will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
