/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from "react";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  CircularProgress,
  Fab,
  Grid,
  IconButton,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/router";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AvTimerIcon from "@mui/icons-material/AvTimer";
import { styled } from "@mui/material/styles";
import { green } from "@mui/material/colors";
import SaveIcon from "@mui/icons-material/Save";

import useStore from "@store/store";
import DataGrid from "@components/DataGrid";
import Meta from "@components/Meta";
import documentRequest, {
  AllStudentDocumentsResponse,
} from "@callbacks/student/rc/documents";
import { CDN_URL } from "@callbacks/constants";
import { errorNotification } from "@callbacks/notifcation";

const boxStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "white solid 2px",
  borderRadius: "10px",
  boxShadow: 24,
  p: 4,
};

const gridMain = {
  width: "100%",
  display: "flex",
  alignItems: "right",
  justifyContent: "right",
};

const transformName = (name: string) => {
  const nname = name.replace(`${CDN_URL}/view/`, "");
  const nameArray = nname.split(".");
  const newName = nameArray[0].slice(14, -33);
  const newNameWithExtension = `${newName}.${nameArray[1]}`;
  return newNameWithExtension;
};

const getURL = (url: string) => `${CDN_URL}/view/${url}`;

const columns: GridColDef[] = [
  {
    field: "ID",
    headerName: "Document ID",
    align: "center",
    headerAlign: "center",
  },
  {
    field: "path",
    headerName: "Document Link",
    sortable: false,
    align: "center",
    headerAlign: "center",
    valueGetter: (params) => getURL(params?.value),
    renderCell: (params) => (
      <Button
        variant="contained"
        sx={{ width: "100%" }}
        onClick={() => {
          window.open(params.value, "_blank");
        }}
      >
        {transformName(params.value)}
      </Button>
    ),
  },
  {
    field: "CreatedAt",
    valueGetter: ({ value }) => value && `${new Date(value).toLocaleString()}`,
    headerName: "Upload Time",
    align: "center",
    headerAlign: "center",
  },
  {
    field: "verified",
    headerName: "Verification Status",
    align: "center",
    headerAlign: "center",
    renderCell: (params) =>
      params.row.verified ? (
        params.row.verified ? (
          <Button
            variant="outlined"
            sx={{ borderRadius: "10px", width: "80%", color: "green" }}
            color="success"
            startIcon={<CheckIcon sx={{ color: "green" }} />}
          >
            Accepted
          </Button>
        ) : (
          <Button
            variant="outlined"
            sx={{ borderRadius: "10px", width: "80%", color: "red" }}
            color="error"
            startIcon={<CloseIcon sx={{ color: "red" }} />}
          >
            Rejected
          </Button>
        )
      ) : (
        <Button
          variant="outlined"
          sx={{ borderRadius: "10px", width: "80%" }}
          startIcon={<AvTimerIcon />}
        >
          Pending by SPO
        </Button>
      ),
  },
];

const Input = styled("input")({
  display: "none",
});

function Resume() {
  const router = useRouter();
  const [fileSaved, setFileSaved] = useState<File | null>(null);
  const { token } = useStore();
  const [allDocuments, setAllDocuments] = useState<
    AllStudentDocumentsResponse[]
  >([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSuccess(false);
    setFileSaved(null);
    setLoading(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (event: { target: { files: any } }) => {
    const { files } = event.target;

    if (allDocuments.filter((document) => !document.verified).length >= 5) {
      errorNotification("You can only upload 5 documents", "Cannot upload");
      setLoading(false);
      return;
    }

    if (!(files && files.length > 0)) {
      setLoading(false);
      return;
    }

    const file = files[0];

    if (file.size > 256000) {
      errorNotification("File size too large", "Max file size is about 200KB");
      setLoading(false);
      return;
    }

    setFileSaved(file);
    setSuccess(true);
    setLoading(false);
  };

  const fetchData = React.useCallback(async () => {
    const data = await documentRequest.get(token);
    setAllDocuments(data);
  }, [token]);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("file", fileSaved !== null ? fileSaved : new Blob());
    await documentRequest.post(formData, token);
    setFileSaved(null);
    handleClose();
    fetchData();
  };

  useEffect(() => {
    if (router.isReady) {
      fetchData();
    }

    setLoading(false);
    setSuccess(false);
  }, [fetchData, router.isReady]);

  const handleButtonClick = () => {
    if (!loading) {
      setSuccess(false);
      setLoading(true);
    }
  };

  const buttonSx = {
    ...(success && {
      bgcolor: green[500],
      "&:hover": {
        bgcolor: green[700],
      },
    }),
  };

  return (
    <>
      <div>
        <Meta title="Manage Documents " />
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={6}>
            <h2>Manage Documents</h2>
          </Grid>
          <Grid item xs={6} style={gridMain}>
            <div>
              <IconButton onClick={handleOpen}>
                <AddIcon />
              </IconButton>
            </div>
          </Grid>
        </Grid>
        <div>
          <Typography>Instructions for submitting your resume:</Typography>
          <ol>
            <li>
              Documents should be in <b>PDF</b> format only.
            </li>
            <li>
              The maximum permissible file size is <b>200KB</b>.{" "}
            </li>
            <li>
              You have to upload the following documents:
              <ol>
                <li>10th Marksheet</li>
                <li>12th Marksheet</li>
                <li>Pingala Verification</li>
                <li>JEE Mains Result</li>
                <li>JEE Advanced Result</li>
              </ol>
            </li>
          </ol>
        </div>
        <Stack>
          <DataGrid
            rows={allDocuments}
            getRowId={(row) => row.ID}
            columns={columns}
          />
        </Stack>
      </div>
      <Modal open={open} onClose={handleClose}>
        <Box sx={boxStyle}>
          <h2 style={{ margin: "0 auto 25px auto", padding: "0 auto" }}>
            Upload Document
          </h2>
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                m: 5,
                position: "relative",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Stack spacing={2} justifyContent="center" alignItems="center">
                <label htmlFor="icon-button-file">
                  <Input
                    accept="application/pdf"
                    id="icon-button-file"
                    type="file"
                    onChange={handleChange}
                  />
                  <Fab
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={buttonSx}
                    onClick={handleButtonClick}
                  >
                    {success ? <CheckIcon /> : <SaveIcon />}
                    {loading && (
                      <CircularProgress
                        size={68}
                        sx={{
                          color: green[500],
                          position: "absolute",
                          top: -6,
                          left: -6,
                          zIndex: 1,
                        }}
                      />
                    )}
                  </Fab>
                </label>
                <Typography variant="subtitle1">{fileSaved?.name}</Typography>
              </Stack>
            </Box>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!success}
            >
              Upload
            </Button>
          </form>
        </Box>
      </Modal>
    </>
  );
}
Resume.layout = "studentDashboard";
export default Resume;
