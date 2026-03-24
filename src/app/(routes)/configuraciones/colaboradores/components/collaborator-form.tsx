"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Area,
  EmployeeGender,
  EmployeePosition,
  PersonnelRequisitionResponse,
} from "@/types/personnel-requisition.types";
import {
  Collaborator,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from "@/types/collaborator.types";
import { personnelRequisitionRelatedService } from "@/services/personnel-requisition-related.service";
import { personnelRequisitionsService } from "@/services/personnel-requisitions.service";
import { getHttpErrorMessage } from "@/utils/http-error";
import { useNotification } from "@/hooks";

type CollaboratorFormProps = {
  isEditing: boolean;
  isReadOnly?: boolean;
  initialData?: Collaborator;
  onCancel: () => void;
  onSubmit: (payload: CreateCollaboratorDto | UpdateCollaboratorDto) => void;
};

type ValidationErrors = {
  code?: string;
  name?: string;
  birthdate?: string;
  dateOfAdmission?: string;
  area?: string;
  position?: string;
  gender?: string;
  personnelRequisition?: string;
};

const formatIsoDateToDisplay = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
};

const normalizeDateInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDisplayDateToIso = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return iso;
};

const getRequisitionLabel = (requisition: PersonnelRequisitionResponse) => {
  const area = requisition.area?.name;
  const position = requisition.positionRequired?.name;

  if (area && position) {
    return `#${requisition.id} - ${area} / ${position}`;
  }

  if (position) {
    return `#${requisition.id} - ${position}`;
  }

  return `#${requisition.id}`;
};

export const CollaboratorForm = ({
  isEditing,
  isReadOnly = false,
  initialData,
  onCancel,
  onSubmit,
}: CollaboratorFormProps) => {
  const { error: notifyError } = useNotification();

  const [code, setCode] = useState(
    initialData?.code ? String(initialData.code) : "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [birthdate, setBirthdate] = useState(
    formatIsoDateToDisplay(initialData?.birthdate),
  );
  const [dateOfAdmission, setDateOfAdmission] = useState(
    formatIsoDateToDisplay(initialData?.dateOfAdmission),
  );

  const [area, setArea] = useState<Area | null>(initialData?.area ?? null);
  const [position, setPosition] = useState<EmployeePosition | null>(
    initialData?.position ?? null,
  );
  const [gender, setGender] = useState<EmployeeGender | null>(
    initialData?.gender ?? null,
  );
  const [personnelRequisition, setPersonnelRequisition] =
    useState<PersonnelRequisitionResponse | null>(
      initialData?.personnelRequisition ?? null,
    );

  const [areas, setAreas] = useState<Area[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [genders, setGenders] = useState<EmployeeGender[]>([]);
  const [requisitions, setRequisitions] = useState<
    PersonnelRequisitionResponse[]
  >([]);

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
    const loadCatalogs = async () => {
      try {
        setIsLoading(true);

        const [areasRes, positionsRes, gendersRes, requisitionsRes] =
          await Promise.all([
            personnelRequisitionRelatedService.getAreas(),
            personnelRequisitionRelatedService.getPositions(),
            personnelRequisitionRelatedService.getGenders(),
            personnelRequisitionsService.getAll({ limit: -1 }),
          ]);

        setAreas(areasRes.data);
        setPositions(positionsRes.data);
        setGenders(gendersRes.data);

        const authorizedRequisitions = requisitionsRes.data.items.filter(
          (item) => item.isAuthorized,
        );

        const hasInitialRequisition =
          initialData?.personnelRequisition &&
          authorizedRequisitions.some(
            (item) => item.id === initialData.personnelRequisition?.id,
          );

        setRequisitions(
          initialData?.personnelRequisition && !hasInitialRequisition
            ? [initialData.personnelRequisition, ...authorizedRequisitions]
            : authorizedRequisitions,
        );
      } catch (error) {
        console.error("Error loading collaborator catalogs:", error);
        notifyError(
          getHttpErrorMessage(
            error,
            "No fue posible cargar catalogos para colaboradores.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCatalogs();
  }, [initialData?.personnelRequisition, notifyError]);

  const maxDateAsString = useMemo(() => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  }, []);

  const handleSubmit = async () => {
    if (isReadOnly) {
      return;
    }

    const nextErrors: ValidationErrors = {};

    const normalizedCode = code.trim();
    const codeAsNumber = parseInt(normalizedCode, 10);
    if (!normalizedCode) {
      nextErrors.code = "Debes ingresar el codigo de empleado.";
    } else if (!/^[0-9]+$/.test(normalizedCode)) {
      nextErrors.code = "El codigo debe contener solo numeros.";
    } else if (Number.isNaN(codeAsNumber) || codeAsNumber <= 0) {
      nextErrors.code = "El codigo debe ser un numero mayor a 0.";
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      nextErrors.name = "Debes ingresar el nombre.";
    }

    const birthdateAsIso = parseDisplayDateToIso(birthdate.trim());
    if (!birthdate.trim()) {
      nextErrors.birthdate = "Debes ingresar la fecha de nacimiento.";
    } else if (!birthdateAsIso) {
      nextErrors.birthdate = "Usa el formato DD/MM/YYYY.";
    }

    const admissionAsIso = parseDisplayDateToIso(dateOfAdmission.trim());
    if (!dateOfAdmission.trim()) {
      nextErrors.dateOfAdmission = "Debes ingresar la fecha de ingreso.";
    } else if (!admissionAsIso) {
      nextErrors.dateOfAdmission = "Usa el formato DD/MM/YYYY.";
    }

    if (!area) {
      nextErrors.area = "Debes seleccionar un area.";
    }

    if (!position) {
      nextErrors.position = "Debes seleccionar una posicion.";
    }

    if (!gender) {
      nextErrors.gender = "Debes seleccionar un genero.";
    }

    if (birthdateAsIso && admissionAsIso && birthdateAsIso > admissionAsIso) {
      nextErrors.dateOfAdmission =
        "La fecha de ingreso no puede ser anterior a nacimiento.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      notifyError("Completa los campos obligatorios del formulario.");
      return;
    }

    if (!birthdateAsIso || !admissionAsIso || !area || !position || !gender) {
      return;
    }

    setValidationErrors({});

    try {
      setIsSubmitting(true);
      await onSubmit({
        code: codeAsNumber,
        name: normalizedName,
        birthdate: birthdateAsIso,
        dateOfAdmission: admissionAsIso,
        areaId: area.id,
        positionId: position.id,
        genderId: gender.id,
        ...(personnelRequisition
          ? { personnelRequisitionId: personnelRequisition.id }
          : {}),
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
            ? "Detalle de colaborador"
            : `${isEditing ? "Editar" : "Crear"} colaborador`}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {isReadOnly
            ? "Consulta del colaborador registrado"
            : `Completa los campos para ${isEditing ? "actualizar" : "crear"} el colaborador`}
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
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Codigo de empleado *
                </Typography>
                <TextField
                  disabled={isReadOnly}
                  size="small"
                  placeholder="Ejemplo: 100245"
                  autoComplete="off"
                  value={code}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (!/^[0-9]*$/.test(nextValue)) {
                      return;
                    }
                    setCode(nextValue);
                    clearFieldError("code");
                  }}
                  fullWidth
                  error={Boolean(validationErrors.code)}
                  helperText={validationErrors.code}
                />
              </Box>

              <Box sx={{ flex: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Nombre *
                </Typography>
                <TextField
                  disabled={isReadOnly}
                  size="small"
                  placeholder="Nombre completo"
                  autoComplete="off"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearFieldError("name");
                  }}
                  fullWidth
                  error={Boolean(validationErrors.name)}
                  helperText={validationErrors.name}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Fecha de nacimiento (DD/MM/YYYY) *
                </Typography>
                <TextField
                  disabled={isReadOnly}
                  size="small"
                  placeholder="DD/MM/YYYY"
                  autoComplete="off"
                  value={birthdate}
                  onChange={(event) => {
                    setBirthdate(normalizeDateInput(event.target.value));
                    clearFieldError("birthdate");
                  }}
                  inputProps={{ maxLength: 10 }}
                  fullWidth
                  error={Boolean(validationErrors.birthdate)}
                  helperText={validationErrors.birthdate}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Fecha de ingreso (DD/MM/YYYY) *
                </Typography>
                <TextField
                  disabled={isReadOnly}
                  size="small"
                  placeholder="DD/MM/YYYY"
                  autoComplete="off"
                  value={dateOfAdmission}
                  onChange={(event) => {
                    setDateOfAdmission(normalizeDateInput(event.target.value));
                    clearFieldError("dateOfAdmission");
                  }}
                  inputProps={{ maxLength: 10 }}
                  fullWidth
                  error={Boolean(validationErrors.dateOfAdmission)}
                  helperText={
                    validationErrors.dateOfAdmission ??
                    `Fecha maxima sugerida: ${maxDateAsString}`
                  }
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Area *
                </Typography>
                <Autocomplete
                  disabled={isReadOnly}
                  options={areas}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={area}
                  onChange={(_, selected) => {
                    setArea(selected);
                    clearFieldError("area");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Selecciona un area"
                      error={Boolean(validationErrors.area)}
                      helperText={validationErrors.area}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Posicion *
                </Typography>
                <Autocomplete
                  disabled={isReadOnly}
                  options={positions}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={position}
                  onChange={(_, selected) => {
                    setPosition(selected);
                    clearFieldError("position");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Selecciona una posicion"
                      error={Boolean(validationErrors.position)}
                      helperText={validationErrors.position}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Genero *
                </Typography>
                <Autocomplete
                  disabled={isReadOnly}
                  options={genders}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={gender}
                  onChange={(_, selected) => {
                    setGender(selected);
                    clearFieldError("gender");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Selecciona un genero"
                      error={Boolean(validationErrors.gender)}
                      helperText={validationErrors.gender}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Requisicion de personal
                </Typography>
                <Autocomplete
                  disabled={isReadOnly}
                  options={requisitions}
                  getOptionLabel={getRequisitionLabel}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={personnelRequisition}
                  onChange={(_, selected) => {
                    setPersonnelRequisition(selected);
                    clearFieldError("personnelRequisition");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Selecciona una requisicion autorizada (opcional)"
                      error={Boolean(validationErrors.personnelRequisition)}
                      helperText={validationErrors.personnelRequisition}
                    />
                  )}
                />
              </Box>
            </Stack>
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
