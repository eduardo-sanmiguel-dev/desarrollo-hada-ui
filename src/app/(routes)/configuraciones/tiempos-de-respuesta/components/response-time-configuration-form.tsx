"use client";

import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { APP_COLORS } from "@/theme/tokens";
import { EmployeePosition } from "@/types/personnel-requisition.types";
import {
  CreateResponseTimeConfigurationDto,
  ResponseTimeConfiguration,
  UpdateResponseTimeConfigurationDto,
} from "@/types/response-time-configuration.types";
import { responseTimeRelatedService } from "@/services/response-time-related.service";
import { getHttpErrorMessage } from "@/utils/http-error";
import { useNotification } from "@/hooks";

type ResponseTimeConfigurationFormProps = {
  isEditing: boolean;
  isReadOnly?: boolean;
  initialData?: ResponseTimeConfiguration;
  onCancel: () => void;
  onSubmit: (
    payload:
      | CreateResponseTimeConfigurationDto
      | UpdateResponseTimeConfigurationDto,
  ) => void;
};

type ValidationErrors = {
  position?: string;
  responseTimeInDays?: string;
};

export const ResponseTimeConfigurationForm = ({
  isEditing,
  isReadOnly = false,
  initialData,
  onCancel,
  onSubmit,
}: ResponseTimeConfigurationFormProps) => {
  const { error: notifyError } = useNotification();

  const [position, setPosition] = useState<EmployeePosition | null>(
    initialData?.position ?? null,
  );
  const [responseTimeInDays, setResponseTimeInDays] = useState(
    initialData?.responseTimeInDays?.toString() ?? "",
  );

  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const clearFieldError = (field: keyof ValidationErrors) => {
    setValidationErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const positionsRes = await responseTimeRelatedService.getPositions({
          withoutConfiguration: true,
        });

        const fetchedPositions = positionsRes.data;
        const hasInitialPosition =
          initialData?.position &&
          fetchedPositions.some(
            (position) => position.id === initialData.position?.id,
          );

        setPositions(
          initialData?.position && !hasInitialPosition
            ? [initialData.position, ...fetchedPositions]
            : fetchedPositions,
        );
      } catch (error) {
        console.error("Error loading positions:", error);
        notifyError(
          getHttpErrorMessage(error, "No fue posible cargar los puestos."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [initialData?.position, notifyError]);

  const handleSubmit = async () => {
    if (isReadOnly) {
      return;
    }

    const nextErrors: ValidationErrors = {};

    if (!position) {
      nextErrors.position = "Debes seleccionar un puesto.";
    }

    const normalizedResponseTime = responseTimeInDays.trim();
    const responseTimeAsNumber = parseInt(normalizedResponseTime, 10);

    if (!normalizedResponseTime) {
      nextErrors.responseTimeInDays = "Debes ingresar el tiempo de respuesta.";
    } else if (!/^[0-9]+$/.test(normalizedResponseTime)) {
      nextErrors.responseTimeInDays =
        "El tiempo de respuesta debe ser un número entero.";
    } else if (Number.isNaN(responseTimeAsNumber) || responseTimeAsNumber < 1) {
      nextErrors.responseTimeInDays =
        "El tiempo de respuesta debe ser mayor o igual a 1.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      notifyError(
        "Completa los campos obligatorios marcados en el formulario.",
      );
      return;
    }

    if (!position) {
      return;
    }

    setValidationErrors({});

    try {
      setIsSubmitting(true);
      await onSubmit({
        positionId: position.id,
        responseTimeInDays: responseTimeAsNumber,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Stack
        spacing={2.5}
        alignItems="center"
        justifyContent="center"
        sx={{ py: 5 }}
      >
        <CircularProgress />
        <Typography>Cargando formulario...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "text.primary",
            letterSpacing: -0.25,
          }}
        >
          {isReadOnly
            ? "Detalle de tiempo de respuesta"
            : `${isEditing ? "Editar" : "Crear"} tiempo de respuesta`}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {isReadOnly
            ? "Consulta de la configuración registrada"
            : `Complete los campos para ${isEditing ? "actualizar" : "crear"} la configuración`}
        </Typography>
      </Box>

      <Card
        sx={{
          borderRadius: "16px",
          border: `1px solid ${alpha(APP_COLORS.primary, 0.2)}`,
          backgroundColor: "background.paper",
          boxShadow: `0 6px 16px ${alpha(APP_COLORS.secondary, 0.08)}`,
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Puesto *
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                options={positions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={position}
                onChange={(_, selected) => {
                  setPosition(selected);
                  clearFieldError("position");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar puesto"
                    error={Boolean(validationErrors.position)}
                    helperText={validationErrors.position}
                  />
                )}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Tiempo de respuesta (dias)*
              </Typography>
              <TextField
                disabled={isReadOnly}
                size="small"
                placeholder="Ejemplo: 5"
                autoComplete="off"
                value={responseTimeInDays}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!/^[0-9]*$/.test(nextValue)) {
                    return;
                  }
                  setResponseTimeInDays(nextValue);
                  clearFieldError("responseTimeInDays");
                }}
                fullWidth
                error={Boolean(validationErrors.responseTimeInDays)}
                helperText={validationErrors.responseTimeInDays}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ borderRadius: "10px", minWidth: 110 }}
        >
          {isReadOnly ? "Volver" : "Cancelar"}
        </Button>

        {!isReadOnly && (
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            sx={{
              borderRadius: "10px",
              minWidth: 140,
              backgroundColor: APP_COLORS.primary,
              color: APP_COLORS.surface,
              "&:hover": { backgroundColor: alpha(APP_COLORS.primary, 0.9) },
            }}
          >
            {isSubmitting
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear"}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
