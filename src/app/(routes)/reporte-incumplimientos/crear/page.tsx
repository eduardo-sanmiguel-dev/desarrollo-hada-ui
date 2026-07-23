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
import { useRouter } from "next/navigation";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
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
  TextField,
  Typography,
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
import { CreateNonconformanceReportDto } from "@/types/nonconformance-report.types";
import { getHttpErrorMessage } from "@/utils/http-error";
import { ALLOWED_REPORT_EMAILS } from "../page";
import { useAuthStore } from "@/stores/auth.store";

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
    "Actividades por arriba de 1.5 mts",
    "Areas comunes sin orden y limpieza",
    "Bloqueo de equipos de emergencia",
    "Disposicion incorrecta de EPP",
    "Falta de permiso de trabajo",
    "Falta de uso de botas blancas",
    "Falta de uso de botas negras",
    "Falta de uso de casco",
    "Falta de uso de guantes",
    "Falta de uso de lentes",
    "Falta de uso de respirador",
    "Ingreso bajo el efecto de alcohol o alguna sustancia.",
    "Ingreso y uso de celular",
    "Intervencion de maquinas sin LOTO",
    "Intervencion de maquinas sin permiso",
    "Juego o bromas",
    "Manipulacion incorrecta de materiales.",
    "No lavar sus vasos, tazas, platos, cubiertos",
    "Puesto de trabajo sin orden y limpieza",
    "Uso incorrecto de los materiales",
    "Uso incorrecto de maquinas y/o equipos",
    "Violencia/ vandalismo",
  ],
};

const CrearReporteIncumplimientoPage = () => {
  const router = useRouter();
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const { error: notifyError, success: notifySuccess } = useNotification();
  const { user } = useAuthStore();

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Collaborator[]>([]);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  const currentUserEmail = user?.email?.trim().toLowerCase() ?? "";

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
  }, [initializeSignaturePad]);

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

  useEffect(() => {
    return () => {
      if (photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) => String(employee.id) === formValues.employeeId,
      ) ?? null,
    [employees, formValues.employeeId],
  );

  const nonconformanceOptions =
    NONCONFORMANCE_OPTIONS_BY_DEVIATION[formValues.deviation] ?? [];

  const isFormValid =
    formValues.employeeId.trim() !== "" &&
    formValues.deviation.trim() !== "" &&
    formValues.nonconformance.trim() !== "";

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

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

      router.push("/reporte-incumplimientos");
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
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Crear reporte incumplimiento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completa la informacion para registrar un nuevo
                    incumplimiento.
                  </Typography>
                </Box>
                {ALLOWED_REPORT_EMAILS.some(
                  (allowedEmail) => allowedEmail === currentUserEmail,
                ) && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ArrowBackRoundedIcon />}
                    onClick={() => router.push("/reporte-incumplimientos")}
                    disabled={isSaving}
                  >
                    Volver al listado
                  </Button>
                )}
              </Stack>

              <Alert severity="info">
                Debes adjuntar foto y firma para guardar el reporte.
              </Alert>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
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
                    getOptionLabel={(option) =>
                      `${option.code} - ${option.name}`
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
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
                    <Typography variant="subtitle2">
                      Foto de evidencia
                    </Typography>
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
                        startIcon={<CameraAltRoundedIcon />}
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
                            maxHeight: 260,
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

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="flex-end"
                  >
                    {ALLOWED_REPORT_EMAILS.some(
                      (allowedEmail) => allowedEmail === currentUserEmail,
                    ) && (
                      <Button
                        color="inherit"
                        variant="outlined"
                        onClick={() => router.push("/reporte-incumplimientos")}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!isFormValid || isSaving || !photoFile}
                      startIcon={
                        isSaving ? (
                          <CircularProgress color="inherit" size={16} />
                        ) : (
                          <SaveRoundedIcon />
                        )
                      }
                      sx={{
                        backgroundColor: APP_COLORS.primary,
                        "&:hover": {
                          backgroundColor: alpha(APP_COLORS.primary, 0.88),
                        },
                      }}
                    >
                      Guardar
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

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
      </Stack>
    </Box>
  );
};

export default CrearReporteIncumplimientoPage;
