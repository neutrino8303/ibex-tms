import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  PilotQualificationsSection,
  type PilotQualificationRow,
  type QualificationOption,
} from "@/components/pilots/pilot-qualifications-section";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  computeStatus,
  daysUntilExpiry,
} from "@/lib/qualifications";
import { userRoleLabel } from "@/lib/roles";
import { prisma } from "@/server/db";
import { requirePilotProfileAccess } from "@/server/require-pilot-view";
import { canManageUserQualifications } from "@/server/user-qualifications";

type PilotProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PilotProfilePage({ params }: PilotProfilePageProps) {
  const { id } = await params;
  const viewer = await requirePilotProfileAccess(id);
  const backHref = viewer.id === id ? "/" : "/admin/users";
  const backLabel = viewer.id === id ? "Back to dashboard" : "Back to users";
  const canManage = canManageUserQualifications(viewer);

  const [pilot, catalog] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        qualifications: {
          include: { qualification: true },
          orderBy: { expiryDate: "asc" },
        },
      },
    }),
    prisma.qualification.findMany({
      orderBy: [{ code: "asc" }],
    }),
  ]);

  if (!pilot) {
    notFound();
  }

  const now = new Date();
  const assignedQualificationIds = new Set(
    pilot.qualifications.map((record) => record.qualificationId),
  );

  const qualificationRows: PilotQualificationRow[] = pilot.qualifications.map(
    (record) => {
      const displayStatus = computeStatus(record.expiryDate, {
        storedStatus: record.status,
        now,
      });
      return {
        id: record.id,
        qualificationId: record.qualificationId,
        code: record.qualification.code,
        name: record.qualification.name,
        validityPeriodDays: record.qualification.validityPeriodDays,
        issuedDate: record.issuedDate,
        expiryDate: record.expiryDate,
        issuingAuthority: record.issuingAuthority,
        storedStatus: record.status,
        displayStatus,
        daysRemaining: daysUntilExpiry(record.expiryDate, now),
      };
    },
  );

  const catalogOptions: QualificationOption[] = catalog.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    validityPeriodDays: item.validityPeriodDays,
    alreadyAssigned: assignedQualificationIds.has(item.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {pilot.firstName} {pilot.lastName}
              </CardTitle>
              <CardDescription>{pilot.email}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {pilot.roles.map((assignment) => (
                <Badge key={assignment.role} variant="secondary">
                  {userRoleLabel[assignment.role]}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Base
            </p>
            <p className="mt-1 text-sm font-medium">{pilot.base ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Employee #
            </p>
            <p className="mt-1 text-sm font-medium">
              {pilot.employeeNumber ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              License #
            </p>
            <p className="mt-1 text-sm font-medium">
              {pilot.licenseNumber ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <PilotQualificationsSection
        userId={pilot.id}
        pilotName={`${pilot.firstName} ${pilot.lastName}`}
        canManage={canManage}
        canViewHistory
        rows={qualificationRows}
        catalog={catalogOptions}
      />
    </div>
  );
}
