export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ClientNavbar from "@/components/layout/ClientNavbar";
import AppointmentsList from "@/components/appointments/AppointmentsList";
import BookingSuccess from "@/components/appointments/BookingSuccess";
import ProfileBanner from "@/components/appointments/ProfileBanner";
import { getMyProfile } from "@/actions/profile";

export default function MyAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
        <Suspense fallback={null}>
          <BookingSuccessWrapper searchParams={searchParams} />
        </Suspense>
        <div className="mb-10">
          <h1 className="font-display text-5xl text-text-primary mb-2">
            My Appointments
          </h1>
          <p className="text-text-secondary text-sm">
            Your upcoming and past sessions at Crowns Enchanted.
          </p>
        </div>
        <Suspense fallback={null}>
          <ProfileBannerWrapper />
        </Suspense>
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          }
        >
          <AppointmentsList />
        </Suspense>
      </div>
    </div>
  );
}

async function ProfileBannerWrapper() {
  const profile = await getMyProfile();
  if (!profile) return null;
  return <ProfileBanner fullName={profile.full_name} phone={profile.phone} />;
}

async function BookingSuccessWrapper({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const params = await searchParams;
  if (params.booked !== "1") return null;
  return <BookingSuccess />;
}
