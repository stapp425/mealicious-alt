import SettingsTabs from "@/components/settings/settings-tabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Mealicious",
  description: "Change your user settings here!"
};

export default async function Layout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="max-w-250 w-full flex-1 flex flex-col gap-1 mx-auto p-4">
      <h1 className="font-bold text-3xl">Account Settings</h1>
      <p className="text-muted-foreground mb-4">Update your account information</p>
      <div className="relative flex-1 flex flex-col sm:flex-row gap-4">
        <SettingsTabs />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}