import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";

import {
  useAppDispatch,
  useAppSelector,
} from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useSelfProfileQuery } from "@/app/api";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { setUser } from "@/features/auth/authSlice";
import { useEffect } from "react";

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { data, refetch } = useSelfProfileQuery(undefined, {
    skip: !user,
  });

  // Keep the cached profile in sync with fresh server data
  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
    }
  }, [data, dispatch]);

  const profile = data?.data ?? user;

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your account details as held by the school administration."
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Identity">
          <dl className="divide-y divide-ink-100 text-sm">
            <ProfileRow label="Full name" value={profile?.fullName} />
            <ProfileRow label="Username" value={profile?.username} mono />
            <ProfileRow label="Email" value={profile?.email || "—"} />
            <ProfileRow label="Role" value={<Badge tone="gold">{profile?.role}</Badge>} />
            <ProfileRow
              label="Status"
              value={
                <Badge tone={profile?.isActive ? "success" : "danger"}>
                  {profile?.isActive ? "Active" : "Inactive"}
                </Badge>
              }
            />
          </dl>
        </Card>

        <Card
          title="Security"
          description="Passwords are changed from the security screen."
        >
          <div className="space-y-3 text-sm text-ink-600">
            <p>
              Last change required:{" "}
              {profile?.mustChangePassword ? (
                <Badge tone="warning">At next sign-in</Badge>
              ) : (
                <Badge tone="success">Up to date</Badge>
              )}
            </p>
            <p>
              Last login:{" "}
              {profile?.lastLogin
                ? new Date(profile.lastLogin).toLocaleString()
                : "Unknown"}
            </p>
            <Link to="/change-password">
              <Button variant="primary">Change password</Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

function ProfileRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className={mono ? "font-mono text-[13px]" : "text-[13px] font-medium text-ink-900"}>
        {value ?? "—"}
      </dd>
    </div>
  );
}
