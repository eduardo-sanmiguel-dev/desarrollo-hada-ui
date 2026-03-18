"use client";

import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  FormHelperText,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { APP_COLORS } from "@/theme/tokens";
import { useNotification } from "@/hooks/use-notification";
import {
  CreatePersonnelRequisitionDto,
  UpdatePersonnelRequisitionDto,
  Area,
  Workplace,
  EmployeePosition,
  ReasonForRequest,
  Employee,
  PersonnelRequisition,
} from "@/types/personnel-requisition.types";
import { personnelRequisitionRelatedService } from "@/services/personnel-requisition-related.service";

type PersonnelRequisitionFormProps = {
  isEditing: boolean;
  isReadOnly?: boolean;
  canAuthorize?: boolean;
  isAuthorizing?: boolean;
  initialData?: PersonnelRequisition;
  onAuthorize?: () => void;
  onCancel: () => void;
  onSubmit: (
    payload: CreatePersonnelRequisitionDto | UpdatePersonnelRequisitionDto,
  ) => void;
};

type ValidationErrors = {
  area?: string;
  workplace?: string;
  positionRequired?: string;
  reasonForRequest?: string;
  numberOfVacancies?: string;
};

export const PersonnelRequisitionForm = ({
  isEditing,
  isReadOnly = false,
  canAuthorize = false,
  isAuthorizing = false,
  initialData,
  onAuthorize,
  onCancel,
  onSubmit,
}: PersonnelRequisitionFormProps) => {
  const { error: notifyError } = useNotification();

  // Form state — objects for Autocomplete fields
  const [area, setArea] = useState<Area | null>(initialData?.area ?? null);
  const [workplace, setWorkplace] = useState<Workplace | null>(
    initialData?.workplace ?? null,
  );
  const [positionRequired, setPositionRequired] =
    useState<EmployeePosition | null>(initialData?.positionRequired ?? null);
  const [numberOfVacancies, setNumberOfVacancies] = useState(
    initialData?.numberOfVacancies?.toString() ?? "",
  );
  const [isExternal, setIsExternal] = useState(initialData?.isExternal ?? true);
  const [reasonForRequest, setReasonForRequest] =
    useState<ReasonForRequest | null>(initialData?.reasonForRequest ?? null);
  const [usersRemplaced, setUsersRemplaced] = useState<number[]>(
    Array.isArray(initialData?.usersRemplaced)
      ? initialData.usersRemplaced.map((u) =>
          typeof u === "object" ? u.id : u,
        )
      : [],
  );
  const [projectReplacedName, setProjectReplacedName] = useState(
    initialData?.projectReplaced?.name ?? "",
  );
  const [observations, setObservations] = useState(
    initialData?.observations ?? "",
  );

  // Related data state
  const [areas, setAreas] = useState<Area[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [reasons, setReasons] = useState<ReasonForRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

  // Loading state
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

  // Load related data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [
          areasRes,
          workplacesRes,
          positionsRes,
          reasonsRes,
          employeesRes,
          projectsRes,
        ] = await Promise.all([
          personnelRequisitionRelatedService.getAreas(),
          personnelRequisitionRelatedService.getWorkplaces(),
          personnelRequisitionRelatedService.getPositions(),
          personnelRequisitionRelatedService.getReasonsForRequest(),
          personnelRequisitionRelatedService.getEmployeesForReplacement(),
          personnelRequisitionRelatedService.getProjects(),
        ]);

        setAreas(areasRes.data);
        setWorkplaces(workplacesRes.data);
        setPositions(positionsRes.data);
        setReasons(reasonsRes.data);
        setEmployees(employeesRes.data);
        setProjectOptions(projectsRes.data.map((p) => p.name));
      } catch (error) {
        console.error("Error loading related data:", error);
        notifyError("No fue posible cargar los datos del formulario.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [initialData, notifyError]);

  const handleSubmit = async () => {
    if (isReadOnly) {
      return;
    }

    const nextErrors: ValidationErrors = {};

    if (!area) {
      nextErrors.area = "Debes seleccionar un área.";
    }
    if (!workplace) {
      nextErrors.workplace = "Debes seleccionar un centro de trabajo.";
    }
    if (!positionRequired) {
      nextErrors.positionRequired = "Debes seleccionar un puesto requerido.";
    }
    if (!reasonForRequest) {
      nextErrors.reasonForRequest =
        "Debes seleccionar un motivo de requerimiento.";
    }

    const vacancies = parseInt(numberOfVacancies, 10);
    if (!numberOfVacancies) {
      nextErrors.numberOfVacancies = "Debes ingresar el número de vacantes.";
    } else if (Number.isNaN(vacancies) || !/^[0-9]+$/.test(numberOfVacancies)) {
      nextErrors.numberOfVacancies =
        "El número de vacantes debe ser un número entero.";
    } else if (vacancies < 1) {
      nextErrors.numberOfVacancies =
        "El número de vacantes debe ser mayor o igual a 1.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      notifyError(
        "Completa los campos obligatorios marcados en el formulario.",
      );
      return;
    }

    if (!area || !workplace || !positionRequired || !reasonForRequest) {
      return;
    }

    setValidationErrors({});

    try {
      setIsSubmitting(true);

      const payload = {
        areaId: area.id,
        workplaceId: workplace.id,
        positionRequiredId: positionRequired.id,
        numberOfVacancies: vacancies,
        isExternal,
        reasonForRequestId: reasonForRequest.id,
        ...(usersRemplaced.length && { usersRemplaced }),
        ...(projectReplacedName.trim() && {
          projectReplacedName: projectReplacedName.trim(),
        }),
        ...(observations.trim() && { observations: observations.trim() }),
      };

      await onSubmit(payload);
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
            ? "Detalle de Solicitud de Personal"
            : `${isEditing ? "Editar" : "Crear"} Solicitud de Personal`}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {isReadOnly
            ? "Consulta de la información registrada en la solicitud"
            : `Complete los campos requeridos para ${isEditing ? "actualizar" : "crear"} una solicitud`}
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
            {/* Area */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Área *
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                options={areas}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={area}
                onChange={(_, selected) => {
                  setArea(selected);
                  clearFieldError("area");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar área"
                    error={Boolean(validationErrors.area)}
                    helperText={validationErrors.area}
                  />
                )}
              />
            </Box>

            {/* Workplace */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Centro de Trabajo *
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                options={workplaces}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={workplace}
                onChange={(_, selected) => {
                  setWorkplace(selected);
                  clearFieldError("workplace");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar centro de trabajo"
                    error={Boolean(validationErrors.workplace)}
                    helperText={validationErrors.workplace}
                  />
                )}
              />
            </Box>

            {/* Position Required */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Puesto Requerido *
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                options={positions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={positionRequired}
                onChange={(_, selected) => {
                  setPositionRequired(selected);
                  clearFieldError("positionRequired");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar puesto"
                    error={Boolean(validationErrors.positionRequired)}
                    helperText={validationErrors.positionRequired}
                  />
                )}
              />
            </Box>

            {/* Number of Vacancies */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Número de Vacantes *
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={numberOfVacancies}
                autoComplete="off"
                type="text"
                disabled={isReadOnly}
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                  const blockedKeys = ["e", "E", "+", "-", "."];
                  if (blockedKeys.includes(event.key)) {
                    event.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^[0-9]+$/.test(value)) {
                    setNumberOfVacancies(value);
                    clearFieldError("numberOfVacancies");
                  }
                }}
                placeholder="Ingrese el número de vacantes"
                error={Boolean(validationErrors.numberOfVacancies)}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  min: 1,
                  step: 1,
                }}
              />
              <FormHelperText
                error={Boolean(validationErrors.numberOfVacancies)}
              >
                {validationErrors.numberOfVacancies ?? "Mínimo 1 vacante"}
              </FormHelperText>
            </Box>

            {/* Conveying Type */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isExternal}
                    disabled={isReadOnly}
                    onChange={(e) => setIsExternal(e.target.checked)}
                  />
                }
                label={`Tipo de Convocatoria: ${isExternal ? "Externa" : "Interna"}`}
              />
            </Box>

            {/* Reason for Request */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Motivo de Requerimiento *
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                options={reasons}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={reasonForRequest}
                onChange={(_, selected) => {
                  setReasonForRequest(selected);
                  clearFieldError("reasonForRequest");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar motivo"
                    error={Boolean(validationErrors.reasonForRequest)}
                    helperText={validationErrors.reasonForRequest}
                  />
                )}
              />
            </Box>

            {/* Users to Replace */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Usuarios que Remplaza (Opcional)
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                multiple
                options={employees}
                getOptionLabel={(employee) => employee.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={employees.filter((e) => usersRemplaced.includes(e.id))}
                onChange={(_, selected) => {
                  setUsersRemplaced(selected.map((e) => e.id));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar y seleccionar empleados"
                  />
                )}
              />
            </Box>

            {/* Project to Develop */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Proyecto a Desarrollar (Opcional)
              </Typography>
              <Autocomplete
                disabled={isReadOnly}
                freeSolo
                options={projectOptions}
                value={projectReplacedName}
                onChange={(_, value) => {
                  setProjectReplacedName(value ?? "");
                }}
                onInputChange={(_, value) => {
                  setProjectReplacedName(value);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Seleccionar o crear nuevo proyecto"
                  />
                )}
              />
              <FormHelperText>
                Puede seleccionar un proyecto existente o escribir uno nuevo
              </FormHelperText>
            </Box>

            {/* Observations */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Observaciones (Opcional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={observations}
                disabled={isReadOnly}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ingrese observaciones adicionales"
                size="small"
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        {isReadOnly && canAuthorize ? (
          <Button
            variant="contained"
            color="success"
            disabled={isAuthorizing}
            onClick={onAuthorize}
            sx={{ borderRadius: "10px" }}
          >
            {isAuthorizing ? "Autorizando..." : "Autorizar"}
          </Button>
        ) : null}
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting || isAuthorizing}
          sx={{
            borderRadius: "10px",
            borderColor: alpha(APP_COLORS.primary, 0.35),
            color: "text.primary",
          }}
        >
          {isReadOnly ? "Cerrar" : "Cancelar"}
        </Button>
        {!isReadOnly ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              bgcolor: APP_COLORS.primary,
              color: APP_COLORS.surface,
              borderRadius: "10px",
              "&:hover": {
                bgcolor: alpha(APP_COLORS.primary, 0.9),
              },
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Guardando...
              </>
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
};
