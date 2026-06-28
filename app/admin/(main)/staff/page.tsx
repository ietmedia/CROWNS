import { getStaff } from "@/actions/staff";
import StaffManager from "@/components/admin/StaffManager";

export default async function StaffPage() {
  const { data: staffList } = await getStaff();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">Staff</h1>
          <p className="text-text-muted text-sm">{staffList.length} team members</p>
        </div>
      </div>

      <StaffManager initialStaff={staffList} />
    </div>
  );
}
