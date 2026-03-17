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
  initialData?: PersonnelRequisition;
  onCancel: () => void;
  onSubmit: (
    payload: CreatePersonnelRequisitionDto | UpdatePersonnelRequisitionDto,
  ) => void;
};

export const PersonnelRequisitionForm = ({
  isEditing,
  initialData,
  onCancel,
  onSubmit,
}: PersonnelRequisitionFormProps) => {
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
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [initialData]);

  const handleSubmit = async () => {
    if (!area || !workplace || !positionRequired || !reasonForRequest) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    const vacancies = parseInt(numberOfVacancies, 10);
    if (!numberOfVacancies || Number.isNaN(vacancies) || vacancies < 1) {
      alert("Por favor ingrese un número válido de vacantes (mínimo 1)");
      return;
    }

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
          {isEditing ? "Editar" : "Crear"} Solicitud de Personal
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Complete los campos requeridos para{" "}
          {isEditing ? "actualizar" : "crear"} una solicitud
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
                options={areas}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={area}
                onChange={(_, selected) => setArea(selected)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar área"
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
                options={workplaces}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={workplace}
                onChange={(_, selected) => setWorkplace(selected)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar centro de trabajo"
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
                options={positions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={positionRequired}
                onChange={(_, selected) => setPositionRequired(selected)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar puesto"
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
                type="number"
                value={numberOfVacancies}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^[0-9]+$/.test(value)) {
                    setNumberOfVacancies(value);
                  }
                }}
                inputProps={{ min: 1, step: 1 }}
                placeholder="Ingrese el número de vacantes"
              />
              <FormHelperText>Mínimo 1 vacante</FormHelperText>
            </Box>

            {/* Conveying Type */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isExternal}
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
                options={reasons}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={reasonForRequest}
                onChange={(_, selected) => setReasonForRequest(selected)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar motivo"
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
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{
            borderRadius: "10px",
            borderColor: alpha(APP_COLORS.primary, 0.35),
            color: "text.primary",
          }}
        >
          Cancelar
        </Button>
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
      </Stack>
    </Stack>
  );
};
