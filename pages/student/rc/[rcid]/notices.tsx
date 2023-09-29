import { Modal, Stack, Switch, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import DataGrid from "@components/DataGrid";
import Meta from "@components/Meta";
import { NoticeParams } from "@callbacks/admin/rc/notice";
import useStore from "@store/store";
import NoticeSReq from "@callbacks/student/rc/noticeS";
import ViewNotice from "@components/Modals/ViewNotice";

const columns: GridColDef[] = [
  {
    field: "ID",
    headerName: "Id",
    hide: true,
  },
  {
    field: "CreatedAt",
    valueGetter: ({ value }) => value && `${new Date(value).toLocaleString()}`,
    headerName: "Published Date And Time",
  },
  {
    field: "title",
    headerName: "Title",
  },
  {
    field: "tags",
    headerName: "Tags",
  },
];

function Notices() {
  const router = useRouter();
  const { rcid } = router.query;
  const rid = (rcid || "").toString();
  const { token } = useStore();
  const [openView, setOpenView] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const publicVapidKey = 'BMrfFtMtL9IWl9vchDbbbYzJlbQwplyZ_fbv8Pei8gPNna_Dr1O-Ng7U7fy0LLqz5RKIxEytTIzyk6TLrcKbN30';
  const handleOpenView = () => {
    setOpenView(true);
  };
  const handleCloseView = () => {
    setOpenView(false);
  };
  const [notices, setNotice] = useState<NoticeParams[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentNotice, setCurrentNotice] = useState<NoticeParams>({
    ID: 0,
    recruitment_cycle_id: 0,
    title: "",
    description: "",
    tags: "",
    attachment: "",
    created_by: "",
    CreatedAt: "",
    last_reminder_at: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      if (rid === undefined || rid === "") return;
      const notice: NoticeParams[] = await NoticeSReq.getSAll(token, rid);
      setNotice(notice);
      setLoading(false);
    };
    fetch();
  }, [rid, token]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribe = async () => {
    setIsSubscribed(!isSubscribed)
    try {
      console.log(navigator.serviceWorker.ready)
      const registration = await navigator.serviceWorker.ready; 
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      console.log(subscription)
  
      await NoticeSReq.browserNotification(token, rid, subscription);
      console.log(subscription)
  
      // Show a success notification
      // showNotification({
      //   message: "Subscription successful!",
      //   variant: "success", // Use "variant" instead of "type"
      // });
    } catch (error) {
      console.error("Error subscribing:", error);
      // Show an error notification
      // showNotification("Error subscribing to notifications", "error");
    }
  };

  return (
    <div>
      <Meta title="RC - Notices" />
      <Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <h2>Notices</h2>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h3>Notifications</h3>
            <Switch
              checked={isSubscribed}
              onChange={handleSubscribe}
              name="notificationSwitch"
              color="primary"
          />
          </div>
        </Stack>

        <DataGrid
          rows={notices}
          getRowId={(row) => row.ID}
          columns={columns}
          loading={loading}
          onCellClick={(params) => {
            setCurrentNotice(params.row);
            handleOpenView();
          }}
        />
      </Stack>
      <Modal open={openView} onClose={handleCloseView}>
        <ViewNotice currentNotice={currentNotice} />
      </Modal>
    </div>
  );
}

Notices.layout = "studentPhaseDashboard";
export default Notices;
