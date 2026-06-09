"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
  IconButton,
} from "@mui/material";
import { alpha, useColorScheme } from "@mui/material/styles";
import SignaturePad from "signature_pad";
import Swal from "sweetalert2";
import Webcam from "react-webcam";

import { useNotification } from "@/hooks";
import { collaboratorsService } from "@/services/collaborators.service";
import { nonconformanceReportsService } from "@/services/nonconformance-reports.service";
import { APP_COLORS } from "@/theme/tokens";
import { Collaborator } from "@/types/collaborator.types";
import {
  CreateNonconformanceReportDto,
  NonconformanceReport,
} from "@/types/nonconformance-report.types";
import { getHttpErrorMessage } from "@/utils/http-error";

type FormValues = {
  employeeId: string;
  deviation: string;
  nonconformance: string;
};

const INITIAL_FORM_VALUES: FormValues = {
  employeeId: "",
  deviation: "",
  nonconformance: "",
};

const DEVIATION_OPTIONS: readonly string[] = [
  "Acto inseguro",
  "Incumplimiento BPM",
];

const NONCONFORMANCE_OPTIONS_BY_DEVIATION: Record<string, readonly string[]> = {
  "Incumplimiento BPM": [
    "Personal con barba",
    "Uso de maquillaje",
    "Consumo de alimentos",
    "Ingreso de dulces",
    "Unas largas",
    "Uso de pulseras",
    "Uso de anillos",
    "Uniformes sucios",
    "Manos sucias",
    "Ingreso de cangureras",
    "Uso inadecuado de uniforme",
    "Uso incorrecto de cofia",
    "Uso incorrecto de guantes",
    "Bata sin abrochar",
    "Estar enfermo y no reportarlo",
    "Ingresar con heridas sin tratamiento",
    "No lavarse las manos en la zona indicada",
    "Mal uso de casilleros",
  ],
  "Acto inseguro": [
    "Juego o bromas",
    "Intervencion de maquinas sin permiso",
    "Intervencion de maquinas sin LOTO",
    "Falta de permiso de trabajo",
    "Actividades por arriba de 1.5 mts",
    "Falta de uso de EPP",
    "Uso incorrecto de los materiales",
    "Violencia/ vandalismo",
    "Ingreso y uso de celular",
    "Ingreso bajo el efecto de alcohol o alguna sustancia.",
    "Disposicion incorrecta de EPP",
    "Uso incorrecto de maquinas y/o equipos",
    "Manipulacion incorrecta de materiales.",
    "Puesto de trabajo sin orden y limpieza",
    "Areas comunes sin orden y limpieza",
    "Bloqueo de equipos de emergencia",
    "No lavar sus vasos, tazas, platos, cubiertos",
  ],
};

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
  const { error: notifyError, success: notifySuccess } = useNotification();

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
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [employees, setEmployees] = useState<Collaborator[]>([]);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  const initializeSignaturePad = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.getBoundingClientRect().width;
    const height = 180;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const context = canvas.getContext("2d");
    if (context) {
      context.scale(ratio, ratio);
    }

    signaturePadRef.current = new SignaturePad(canvas, {
      penColor: "#0b1d12",
      minWidth: 0.9,
      maxWidth: 2.4,
    });
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      initializeSignaturePad();
    });

    const handleResize = () => {
      const strokes = signaturePadRef.current?.toData() ?? [];
      initializeSignaturePad();

      if (strokes.length > 0) {
        signaturePadRef.current?.fromData(strokes);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      signaturePadRef.current?.off();
      signaturePadRef.current = null;
    };
  }, [initializeSignaturePad, isDialogOpen]);

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
    void loadReports();
  }, [loadReports]);

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await collaboratorsService.getAll();
      setEmployees(response.data);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(
          err,
          "No fue posible cargar el listado de empleados.",
        ),
      );
      console.error(err);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

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

  const handleOpenCreateDialog = () => {
    setFormValues(INITIAL_FORM_VALUES);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setIsDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    if (isSaving) {
      return;
    }

    setIsDialogOpen(false);
    setFormValues(INITIAL_FORM_VALUES);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    signaturePadRef.current?.clear();
  };

  const handleSelectPhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handleTakePhotoClick = () => {
    setIsCameraDialogOpen(true);
  };

  const handleCloseCameraDialog = () => {
    if (isSaving) {
      return;
    }

    setIsCameraDialogOpen(false);
  };

  const handleCapturePhoto = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot) {
      notifyError("No fue posible capturar la foto. Intenta nuevamente.");
      return;
    }

    const [meta, base64] = screenshot.split(",");
    const mimeMatch = /data:(.*?);base64/.exec(meta);
    const mimeType = mimeMatch?.[1] || "image/jpeg";

    const byteString = atob(base64);
    const byteNumbers = new Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
      byteNumbers[i] = byteString.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const extension = mimeType.includes("png") ? "png" : "jpg";
    const file = new File([byteArray], `captura-${Date.now()}.${extension}`, {
      type: mimeType,
    });

    setPhotoFile(file);
    setPhotoPreviewUrl(screenshot);
    setIsCameraDialogOpen(false);
  }, [notifyError]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      notifyError("El archivo seleccionado debe ser una imagen.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

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

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) => String(employee.id) === formValues.employeeId,
      ) ?? null,
    [employees, formValues.employeeId],
  );

  const isFormValid =
    formValues.employeeId.trim() !== "" &&
    formValues.deviation.trim() !== "" &&
    formValues.nonconformance.trim() !== "";

  const nonconformanceOptions =
    NONCONFORMANCE_OPTIONS_BY_DEVIATION[formValues.deviation] ?? [];

  const handleCreate = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      notifyError("La firma es requerida para guardar el reporte.");
      return;
    }

    if (!photoFile) {
      notifyError("La foto es obligatoria para guardar el reporte.");
      return;
    }

    const signatureBase64 = signaturePadRef.current.toDataURL("image/png");

    const payload: CreateNonconformanceReportDto = {
      employeeId: Number(formValues.employeeId),
      deviation: formValues.deviation.trim(),
      nonconformance: formValues.nonconformance.trim(),
      signatureBase64,
    };

    try {
      setIsSaving(true);
      await nonconformanceReportsService.create(payload, photoFile);
      setIsDialogOpen(false);
      setFormValues(INITIAL_FORM_VALUES);
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      signaturePadRef.current?.clear();
      setPage(0);
      await loadReports();

      try {
        const countResponse =
          await nonconformanceReportsService.getCountByEmployee(
            payload.employeeId,
          );

        await Swal.fire({
          icon: "success",
          title: "Reporte creado",
          text: `Este empleado lleva ${countResponse.data.totalReports} reportes acumulados.`,
          confirmButtonText: "Aceptar",
        });
      } catch (countError) {
        notifySuccess("Incumplimiento creado exitosamente.");
        console.error(countError);
      }
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "No fue posible crear el incumplimiento."),
      );
      console.error(err);
    } finally {
      setIsSaving(false);
    }
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
                  onClick={handleOpenCreateDialog}
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
                      <TableCell>ID</TableCell>
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
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {row.id}
                          </TableCell>
                          <TableCell sx={{ minWidth: 190 }}>
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
          open={isDialogOpen}
          onClose={handleCloseCreateDialog}
          maxWidth="sm"
          fullWidth
          component="form"
          onSubmit={handleCreate}
        >
          <DialogTitle>Crear reporte incumplimiento</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Completa la informacion para registrar un nuevo incumplimiento.
              </Alert>
              <Autocomplete
                options={employees}
                loading={isLoadingEmployees}
                value={selectedEmployee}
                onChange={(_event, value) =>
                  setFormValues((current) => ({
                    ...current,
                    employeeId: value ? String(value.id) : "",
                  }))
                }
                getOptionLabel={(option) => `${option.code} - ${option.name}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={
                  isLoadingEmployees
                    ? "Cargando empleados..."
                    : "No hay colaboradores disponibles"
                }
                renderInput={(params) => (
                  <TextField {...params} label="Colaborador" required />
                )}
                disabled={isLoadingEmployees && employees.length === 0}
                fullWidth
              />
              <TextField
                label="Desviacion"
                select
                value={formValues.deviation}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    deviation: event.target.value,
                    nonconformance: "",
                  }))
                }
                required
                fullWidth
              >
                {DEVIATION_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="No conformidad"
                select
                value={formValues.nonconformance}
                disabled={!formValues.deviation}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    nonconformance: event.target.value,
                  }))
                }
                required
                fullWidth
              >
                {nonconformanceOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle2">Foto de evidencia</Typography>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectPhotoClick}
                    disabled={isSaving}
                  >
                    Adjuntar imagen
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleTakePhotoClick}
                    disabled={isSaving}
                  >
                    Tomar foto
                  </Button>
                </Stack>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
                <Box
                  sx={{
                    border: `1px dashed ${alpha(APP_COLORS.secondary, 0.35)}`,
                    borderRadius: 1,
                    p: 1,
                    minHeight: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: APP_COLORS.surface,
                  }}
                >
                  {photoPreviewUrl ? (
                    <Box
                      component="img"
                      src={photoPreviewUrl}
                      alt="Vista previa de evidencia"
                      sx={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "contain",
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Debes adjuntar una foto para crear el reporte.
                    </Typography>
                  )}
                </Box>
              </Stack>
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle2">Firma</Typography>
                  <Button
                    size="small"
                    onClick={handleClearSignature}
                    disabled={isSaving}
                  >
                    Limpiar firma
                  </Button>
                </Stack>
                <Box
                  sx={{
                    border: `1px solid ${alpha(APP_COLORS.secondary, 0.25)}`,
                    borderRadius: 1,
                    p: 0.5,
                    bgcolor: APP_COLORS.surface,
                  }}
                >
                  <canvas
                    ref={signatureCanvasRef}
                    style={{
                      width: "100%",
                      height: "180px",
                      display: "block",
                      backgroundColor: "#fff",
                      borderRadius: 4,
                      touchAction: "none",
                    }}
                  />
                </Box>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseCreateDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isFormValid || isSaving || !photoFile}
              startIcon={
                isSaving ? <CircularProgress color="inherit" size={16} /> : null
              }
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isCameraDialogOpen}
          onClose={handleCloseCameraDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Tomar foto</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                mt: 1,
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "#000",
              }}
            >
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                videoConstraints={{
                  facingMode: { ideal: "environment" },
                }}
                style={{ width: "100%", display: "block" }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCameraDialog}>Cancelar</Button>
            <Button variant="contained" onClick={handleCapturePhoto}>
              Capturar
            </Button>
          </DialogActions>
        </Dialog>

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
