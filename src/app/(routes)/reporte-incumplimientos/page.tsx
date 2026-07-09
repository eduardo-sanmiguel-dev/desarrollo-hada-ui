"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useColorScheme } from "@mui/material/styles";

import { useNotification } from "@/hooks";
import { nonconformanceReportsService } from "@/services/nonconformance-reports.service";
import { useAuthStore } from "@/stores/auth.store";
import { APP_COLORS } from "@/theme/tokens";
import { NonconformanceReport } from "@/types/nonconformance-report.types";
import { getHttpErrorMessage } from "@/utils/http-error";

export const ALLOWED_REPORT_EMAILS = ["strujillo@hadamexico.com"] as const;

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const collaboratorLabel = (row: NonconformanceReport) => {
  if (row.employeeName && row.employeeCode) {
    return `${row.employeeCode} - ${row.employeeName}`;
  }

  if (row.employeeName) {
    return row.employeeName;
  }

  return `ID ${row.employeeId}`;
};

const ReporteIncumplimientosPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const { error: notifyError } = useNotification();
  const { user, isSessionReady } = useAuthStore();

  const [rows, setRows] = useState<NonconformanceReport[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

  const currentUserEmail = user?.email?.trim().toLowerCase() ?? "";
  const canViewReportsList = ALLOWED_REPORT_EMAILS.some(
    (allowedEmail) => allowedEmail === currentUserEmail,
  );
  const shouldRedirectToCreate = isSessionReady && !canViewReportsList;

  useEffect(() => {
    if (!shouldRedirectToCreate) {
      return;
    }

    router.replace("/reporte-incumplimientos/crear");
  }, [router, shouldRedirectToCreate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const searchFromUrl = searchParams.get("search")?.trim() ?? "";

    if (!searchFromUrl) {
      return;
    }

    setSearchTerm(searchFromUrl);
    setDebouncedSearchTerm(searchFromUrl);
    setPage(0);
  }, [searchParams]);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await nonconformanceReportsService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearchTerm.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setRows(Array.isArray(response.data?.items) ? response.data.items : []);
      setTotalRows(
        typeof response.data?.total === "number" ? response.data.total : 0,
      );
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "No fue posible cargar los incumplimientos."),
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [notifyError, page, rowsPerPage, debouncedSearchTerm, startDate, endDate]);

  useEffect(() => {
    if (shouldRedirectToCreate) {
      return;
    }

    void loadReports();
  }, [loadReports, shouldRedirectToCreate]);

  if (shouldRedirectToCreate) {
    return null;
  }

  const hasActiveFilters =
    debouncedSearchTerm.trim() !== "" || startDate !== "" || endDate !== "";

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 350));
      await loadReports();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setStartDate("");
    setEndDate("");
    setPage(0);
    router.replace(pathname, { scroll: false });
  };

  const handleDownloadExcel = async () => {
    if (rows.length === 0) {
      notifyError("No hay registros visibles para exportar a Excel.");
      return;
    }

    try {
      setIsDownloadingExcel(true);
      const response = await nonconformanceReportsService.exportExcel(
        rows.map((row) => row.id),
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "FORMATO_RECORRIDO.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "No fue posible generar el archivo Excel."),
      );
      console.error(err);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const openImagePreview = (imageUrl?: string | null) => {
    if (!imageUrl) {
      return;
    }

    setSelectedImageUrl(imageUrl);
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setSelectedImageUrl("");
    setIsImagePreviewOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
      <Stack spacing={2.5}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 1,
            border: `1px solid ${
              isDarkMode
                ? alpha(APP_COLORS.surface, 0.12)
                : alpha(APP_COLORS.secondary, 0.12)
            }`,
            backgroundColor: isDarkMode
              ? alpha(APP_COLORS.surface, 0.02)
              : alpha(APP_COLORS.surface, 0.98),
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", lg: "center" }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Reporte incumplimientos de SST y BPM
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Listado de registros de incumplimientos.
                </Typography>
              </Box>

              <Box
                sx={{
                  width: "100%",
                  display: "grid",
                  gap: 1.2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    xl: "2fr repeat(6, minmax(0, 1fr))",
                  },
                  alignItems: "center",
                }}
              >
                <TextField
                  size="small"
                  label="Buscar"
                  placeholder="Buscar en todos los campos"
                  autoComplete="off"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(0);
                  }}
                  fullWidth
                  sx={{
                    gridColumn: {
                      xs: "1 / -1",
                      sm: "1 / -1",
                      md: "1 / -1",
                      xl: "1 / span 2",
                    },
                  }}
                />
                <TextField
                  size="small"
                  label="Fecha inicio"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  label="Fecha fin"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  sx={{ width: { xs: "100%", sm: "100%", md: "auto" } }}
                  startIcon={
                    isRefreshing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                >
                  Refrescar
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleClearFilters}
                  sx={{ width: { xs: "100%", sm: "100%", md: "auto" } }}
                  disabled={
                    isLoading &&
                    !searchTerm.trim() &&
                    !debouncedSearchTerm.trim() &&
                    !startDate &&
                    !endDate
                  }
                >
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => router.push("/reporte-incumplimientos/crear")}
                  sx={{
                    width: { xs: "100%", sm: "100%", md: "auto" },
                    backgroundColor: APP_COLORS.primary,
                    "&:hover": {
                      backgroundColor: alpha(APP_COLORS.primary, 0.88),
                    },
                  }}
                >
                  Crear
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  sx={{ width: { xs: "100%", sm: "100%", md: "auto" } }}
                  startIcon={
                    isDownloadingExcel ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DownloadRoundedIcon />
                    )
                  }
                  onClick={handleDownloadExcel}
                  disabled={isLoading || isDownloadingExcel}
                >
                  Descargar
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 1,
            border: `1px solid ${
              isDarkMode
                ? alpha(APP_COLORS.surface, 0.12)
                : alpha(APP_COLORS.secondary, 0.12)
            }`,
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                minHeight: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 760 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: APP_COLORS.primary,
                        "& .MuiTableCell-root": {
                          color: APP_COLORS.surface,
                          fontWeight: 700,
                          borderBottom: "none",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableCell>Colaborador</TableCell>
                      <TableCell>Desviacion</TableCell>
                      <TableCell>No conformidad</TableCell>
                      <TableCell>Imagen</TableCell>
                      <TableCell>Reportado por</TableCell>
                      <TableCell>Creado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box sx={{ py: 4, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              {hasActiveFilters
                                ? "No hay resultados para la busqueda actual."
                                : "No hay incumplimientos registrados."}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell
                            sx={{ whiteSpace: "nowrap", minWidth: 190 }}
                          >
                            {collaboratorLabel(row)}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-word" }}
                            >
                              {row.deviation}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-word" }}
                            >
                              {row.nonconformance}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openImagePreview(row.imageUrl)}
                              disabled={!row.imageUrl}
                            >
                              <ImageOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            {row.reportedByName ?? row.reportedBy}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {formatDate(row.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalRows}
                page={page}
                onPageChange={(_event, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  const nextRows = Number(event.target.value);
                  setRowsPerPage(nextRows);
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20, { label: "Todos", value: -1 }]}
                labelRowsPerPage="Filas por pagina"
              />
            </>
          )}
        </Card>

        <Dialog
          open={isImagePreviewOpen}
          onClose={closeImagePreview}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Imagen de evidencia</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                width: "100%",
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedImageUrl ? (
                <Box
                  component="img"
                  src={selectedImageUrl}
                  alt="Evidencia del reporte"
                  sx={{
                    width: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Typography color="text.secondary">
                  No hay imagen para este registro.
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeImagePreview}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
};

export default ReporteIncumplimientosPage;
