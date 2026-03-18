"use client";

import { useCallback, useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { PersonnelRequisitionForm } from "./components/personnel-requisition-form";
import {
  PersonnelRequisitionTable,
  SortField,
} from "./components/personnel-requisition-table";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { alpha, useColorScheme } from "@mui/material/styles";
import { APP_COLORS } from "@/theme/tokens";
import {
  PersonnelRequisition,
  CreatePersonnelRequisitionDto,
  UpdatePersonnelRequisitionDto,
} from "@/types/personnel-requisition.types";
import { personnelRequisitionsService } from "@/services/personnel-requisitions.service";

type SortDirection = "asc" | "desc" | null;

const PersonnelRequisitionPage = () => {
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";

  const [requisitions, setRequisitions] = useState<PersonnelRequisition[]>([]);
  const [totalRequisitions, setTotalRequisitions] = useState(0);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequisitionId, setEditingRequisitionId] = useState<
    number | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonnelRequisition | null>(
    null,
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRequisitions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await personnelRequisitionsService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
        sortField: sortField ?? undefined,
        sortDirection: sortDirection ?? undefined,
      });
      setRequisitions(response.data.items);
      setTotalRequisitions(response.data.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al cargar solicitudes de personal";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, sortField, sortDirection]);

  useEffect(() => {
    loadRequisitions();
  }, [loadRequisitions]);

  const handleSortToggle = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortField(null);
      setSortDirection(null);
      return;
    }

    setSortDirection("asc");
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // pausa de medio segundo para mostrar el spinner de refresco, ya que la carga suele ser muy rápida
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadRequisitions();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateForm = () => {
    setEditingRequisitionId(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRequisitionId(null);
  };

  const handleSaveRequisition = async (
    payload: CreatePersonnelRequisitionDto | UpdatePersonnelRequisitionDto,
  ) => {
    try {
      setError(null);

      if (editingRequisitionId !== null) {
        // Update existing
        await personnelRequisitionsService.update(
          editingRequisitionId,
          payload as UpdatePersonnelRequisitionDto,
        );
        await loadRequisitions();
        setSuccessMessage("Solicitud actualizada exitosamente");
      } else {
        // Create new
        await personnelRequisitionsService.create(
          payload as CreatePersonnelRequisitionDto,
        );
        setPage(0);
        await loadRequisitions();
        setSuccessMessage("Solicitud creada exitosamente");
      }

      closeForm();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar la solicitud";
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleDeleteRequisition = async (id: number) => {
    try {
      await personnelRequisitionsService.delete(id);
      await loadRequisitions();
      setDeleteTarget(null);
      setSuccessMessage("Solicitud eliminada exitosamente");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar la solicitud";
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    handleDeleteRequisition(deleteTarget.id);
  };

  const sortLabel = (field: SortField) => {
    if (sortField !== field || !sortDirection) {
      return "null";
    }

    return sortDirection;
  };

  const highlightQuery = debouncedSearchTerm.trim();

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderHighlightedText = (value: string | number) => {
    const text = String(value);

    if (!highlightQuery) {
      return text;
    }

    const matcher = new RegExp(`(${escapeRegExp(highlightQuery)})`, "ig");
    const chunks = text.split(matcher);

    return chunks.map((chunk, index) => {
      const isMatch = chunk.toLowerCase() === highlightQuery.toLowerCase();

      if (!isMatch) {
        return (
          <Box component="span" key={`${chunk}-${index}`}>
            {chunk}
          </Box>
        );
      }

      return (
        <Box
          component="mark"
          key={`${chunk}-${index}`}
          sx={{
            px: 0.35,
            py: 0.05,
            borderRadius: "6px",
            backgroundColor: alpha(APP_COLORS.primary, 0.26),
            color: "inherit",
          }}
        >
          {chunk}
        </Box>
      );
    });
  };

  const editingRequisition =
    editingRequisitionId !== null
      ? (requisitions.find((req) => req.id === editingRequisitionId) ?? null)
      : null;

  if (isFormOpen) {
    return (
      <PersonnelRequisitionForm
        isEditing={editingRequisitionId !== null}
        initialData={editingRequisition ?? undefined}
        onCancel={closeForm}
        onSubmit={handleSaveRequisition}
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      {/* Alerts */}
      {error && <Alert severity="error">{error}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      {/* Header */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              letterSpacing: -0.25,
            }}
          >
            Solicitudes de personal
          </Typography>
          <Chip
            label={`${totalRequisitions} solicitudes`}
            size="small"
            sx={{
              bgcolor: alpha(APP_COLORS.primary, 0.14),
              border: `1px solid ${alpha(APP_COLORS.primary, 0.28)}`,
              fontWeight: 700,
            }}
          />
        </Stack>
      </Box>

      {/* Search and Actions Bar */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
      >
        <Card
          sx={{
            borderRadius: "16px",
            border: `1px solid ${alpha(APP_COLORS.primary, 0.2)}`,
            backgroundColor: "background.paper",
            boxShadow: `0 6px 16px ${alpha(APP_COLORS.secondary, 0.08)}`,
            flex: 1,
            maxWidth: { lg: 760 },
          }}
        >
          <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <TextField
              placeholder="Buscar por ID, área, solicitante, cargo solicitante, centro de trabajo, cargo requerido, motivo o tipo de convocatoria"
              size="small"
              value={searchTerm}
              autoComplete="off"
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(0);
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 44,
                },
              }}
            />
          </CardContent>
        </Card>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="flex-end"
          sx={{ minWidth: { lg: "fit-content" } }}
        >
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreateForm}
            sx={{
              bgcolor: APP_COLORS.primary,
              color: APP_COLORS.surface,
              borderRadius: "12px",
              px: 2,
              "&:hover": {
                bgcolor: alpha(APP_COLORS.primary, 0.9),
              },
            }}
          >
            Crear
          </Button>

          <Button
            variant="outlined"
            startIcon={
              isRefreshing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshRoundedIcon />
              )
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              borderRadius: "12px",
              borderColor: alpha(APP_COLORS.primary, 0.35),
              color: "text.primary",
            }}
          >
            {isRefreshing ? "Refrescando..." : "Refrescar"}
          </Button>
        </Stack>
      </Stack>

      <Card
        sx={{
          borderRadius: "16px",
          border: `1px solid ${alpha(APP_COLORS.primary, 0.2)}`,
          backgroundColor: "background.paper",
          boxShadow: `0 6px 16px ${alpha(APP_COLORS.secondary, 0.08)}`,
          overflow: "hidden",
        }}
      >
        {isLoading && totalRequisitions === 0 ? (
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 8 }}
          >
            <CircularProgress />
            <Typography>Cargando solicitudes de personal...</Typography>
          </Stack>
        ) : (
          <PersonnelRequisitionTable
            requisitions={requisitions}
            totalCount={totalRequisitions}
            page={page}
            rowsPerPage={rowsPerPage}
            isDarkMode={isDarkMode}
            onSortToggle={handleSortToggle}
            sortLabel={sortLabel}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage);
              setPage(0);
            }}
            renderHighlightedText={renderHighlightedText}
            hasSearchTerm={Boolean(debouncedSearchTerm)}
          />
        )}
      </Card>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `Se eliminará la solicitud de personal ID: ${deleteTarget.id} del área "${deleteTarget.area?.name}".`
              : "Se eliminará la solicitud de personal seleccionada."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{ color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ borderRadius: "10px" }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default PersonnelRequisitionPage;
