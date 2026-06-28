import { getSettings } from "@/actions/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import { type SalonSettings } from "@/actions/settings";

const DEFAULTS: SalonSettings = {
  id: "00000000-0000-0000-0000-000000000001",
  salon_name: "Crowns Enchanted",
  phone: "470-495-8894",
  email: "Info@crownsenchanted.com",
  address: "2900 Delk Road SE, Suite 17, Marietta, GA 30067",
  open_time: "09:00",
  close_time: "18:00",
  slot_interval_minutes: 30,
  cancellation_policy_hours: 24,
  no_show_fee_cents: 5000,
  reminder_hours_before: 48,
  google_calendar_id: null,
};

export default async function SettingsPage() {
  const { data: settings } = await getSettings();

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-1">Settings</h1>
        <p className="text-text-muted text-sm">Salon information, hours, and booking policy</p>
      </div>

      <SettingsForm initialSettings={settings ?? DEFAULTS} />
    </div>
  );
}
