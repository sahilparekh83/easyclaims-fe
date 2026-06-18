"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  adminListNotifications,
  adminMarkNotificationRead,
  adminMarkAllNotificationsRead,
  adminDeleteNotification,
} from "@/imports/core/api";

interface Notification {
  id: string;
  title: string;
  message?: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => adminListNotifications({ limit: 50 }),
  });

  const items: Notification[] = data?.data?.data ?? [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminMarkNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("Notification marked as read");
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => adminMarkAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("Notification deleted");
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });

  const rowClassName = (row: Notification) => (row.is_read ? "" : "unread-row");

  const isReadBody = (row: Notification) => (
    <StatusBadge value={row.is_read} trueLabel="Read" falseLabel="Unread" />
  );

  const createdAtBody = (row: Notification) =>
    dayjs(row.created_at).format("DD MMM YYYY HH:mm");

  const messageBody = (row: Notification) => row.message ?? row.body ?? "—";

  const actionsBody = (row: Notification) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {!row.is_read && (
        <Button
          label="Mark Read"
          size="small"
          severity="info"
          onClick={() => markReadMutation.mutate(row.id)}
          loading={markReadMutation.isPending}
        />
      )}
      <Button
        label="Delete"
        size="small"
        severity="danger"
        onClick={() => deleteMutation.mutate(row.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );

  return (
    <>
      <style>{`
        .p-datatable .unread-row {
          font-weight: 600;
          background-color: #eff6ff !important;
        }
      `}</style>

      <PageHeader
        title="Notifications"
        subtitle="View and manage admin notifications"
        actions={
          <Button
            label="Mark All Read"
            icon="pi pi-check-square"
            severity="secondary"
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
          />
        }
      />

      <DataTable
        value={items}
        loading={isLoading}
        paginator
        rows={20}
        rowClassName={rowClassName}
        emptyMessage="No notifications found"
        style={{ marginTop: "1.5rem" }}
      >
        <Column field="title" header="Title" sortable />
        <Column header="Message / Body" body={messageBody} />
        <Column header="Is Read" body={isReadBody} />
        <Column header="Created At" body={createdAtBody} sortable sortField="created_at" />
        <Column header="Actions" body={actionsBody} />
      </DataTable>
    </>
  );
}
