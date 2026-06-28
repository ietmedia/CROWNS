import { calculatePayroll, getPayrollHistory } from "@/actions/payroll";
import PayrollPanel from "@/components/admin/PayrollPanel";

function defaultPeriod() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstOfMonth.toISOString().slice(0, 10),
    end: lastOfMonth.toISOString().slice(0, 10),
  };
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const period = {
    start: params.start ?? defaultPeriod().start,
    end: params.end ?? defaultPeriod().end,
  };

  const [{ data: summaries }, { data: history }] = await Promise.all([
    calculatePayroll(period.start, period.end),
    getPayrollHistory(),
  ]);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-1">Payroll</h1>
        <p className="text-text-muted text-sm">Calculate and record staff commission payouts</p>
      </div>

      <PayrollPanel
        summaries={summaries}
        history={history}
        periodStart={period.start}
        periodEnd={period.end}
      />
    </div>
  );
}
