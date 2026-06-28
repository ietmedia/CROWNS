import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAppointmentForIntake, getIntakeForm } from "@/actions/intake";
import IntakeFormClient from "@/components/client/IntakeFormClient";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;

  const [{ data: appointment }, { data: existing }] = await Promise.all([
    getAppointmentForIntake(appointmentId),
    getIntakeForm(appointmentId),
  ]);

  if (!appointment) notFound();

  if (existing?.signed_at) {
    redirect("/my-appointments?intake=done");
  }

  const svc = appointment.services;
  const stf = appointment.staff;

  const date = new Date(appointment.start_time).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/my-appointments" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← My Appointments
        </Link>
        <span className="font-display text-lg text-gradient-gold">Crowns Enchanted</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-text-primary mb-2">Intake Form</h1>
          <p className="text-text-secondary text-sm">
            {svc?.name ?? "Appointment"} · {stf ? `with ${stf.name}` : ""} · {date}
          </p>
        </div>

        <IntakeFormClient appointmentId={appointmentId} />
      </main>
    </div>
  );
}
