"use client";

import { useCallback, useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { alpha, useColorScheme } from "@mui/material/styles";

import { useNotification } from "@/hooks";
import { APP_COLORS } from "@/theme/tokens";
import { responseTimeConfigurationsService } from "@/services/response-time-configurations.service";
import { getHttpErrorMessage } from "@/utils/http-error";
import {
  CreateResponseTimeConfigurationDto,
  ResponseTimeConfiguration,
  UpdateResponseTimeConfigurationDto,
} from "@/types/response-time-configuration.types";
import {
  ResponseTimeConfigurationTable,
  SortField,
} from "@/app/(routes)/configuraciones/tiempos-de-respuesta/components/response-time-configuration-table";
import { ResponseTimeConfigurationForm } from "@/app/(routes)/configuraciones/tiempos-de-respuesta/components/response-time-configuration-form";

type SortDirection = "asc" | "desc" | null;
type FormMode = "create" | "edit" | "view" | null;

const TiemposDeRespuestaPage = () => {
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const { error: notifyError } = useNotification();

  const [rows, setRows] = useState<ResponseTimeConfiguration[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] =
    useState<ResponseTimeConfiguration | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ResponseTimeConfiguration | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRows = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await responseTimeConfigurationsService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
        sortField: sortField ?? undefined,
        sortDirection: sortDirection ?? undefined,
      });

      setRows(response.data.items);
      setTotalRows(response.data.total);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "Error al cargar tiempos de respuesta."),
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    debouncedSearchTerm,
    sortField,
    sortDirection,
    notifyError,
  ]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

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
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadRows();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingRowId(null);
    setEditingRowData(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode(null);
    setEditingRowId(null);
    setEditingRowData(null);
  };

  const handleOpenEditForm = async (id: number) => {
    try {
      const response = await responseTimeConfigurationsService.getById(id);
      setFormMode("edit");
      setEditingRowId(id);
      setEditingRowData(response.data);
      setIsFormOpen(true);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(
          err,
          "No fue posible cargar la configuración para edición.",
        ),
      );
      console.error(err);
    }
  };

  const handleOpenViewForm = async (id: number) => {
    try {
      const response = await responseTimeConfigurationsService.getById(id);
      setFormMode("view");
      setEditingRowId(id);
      setEditingRowData(response.data);
      setIsFormOpen(true);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(
          err,
          "No fue posible cargar el detalle de la configuración.",
        ),
      );
      console.error(err);
    }
  };

  const handleSave = async (
    payload:
      | CreateResponseTimeConfigurationDto
      | UpdateResponseTimeConfigurationDto,
  ) => {
    try {
      if (editingRowId !== null) {
        await responseTimeConfigurationsService.update(
          editingRowId,
          payload as UpdateResponseTimeConfigurationDto,
        );
        await loadRows();
        setSuccessMessage("Configuración actualizada exitosamente");
      } else {
        await responseTimeConfigurationsService.create(
          payload as CreateResponseTimeConfigurationDto,
        );
        setPage(0);
        await loadRows();
        setSuccessMessage("Configuración creada exitosamente");
      }

      closeForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "Error al guardar la configuración."),
      );
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await responseTimeConfigurationsService.delete(id);
      await loadRows();
      setDeleteTarget(null);
      setSuccessMessage("Configuración eliminada exitosamente");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "Error al eliminar la configuración."),
      );
      console.error(err);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    void handleDelete(deleteTarget.id);
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

  if (isFormOpen) {
    return (
      <ResponseTimeConfigurationForm
        isEditing={formMode === "edit"}
        isReadOnly={formMode === "view"}
        initialData={editingRowData ?? undefined}
        onCancel={closeForm}
        onSubmit={handleSave}
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

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
            Tiempos de respuesta
          </Typography>
          <Chip
            label={`${totalRows} configuraciones`}
            size="small"
            sx={{
              bgcolor: alpha(APP_COLORS.primary, 0.14),
              border: `1px solid ${alpha(APP_COLORS.primary, 0.28)}`,
              fontWeight: 700,
            }}
          />
        </Stack>
      </Box>

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
              placeholder="Buscar por ID, puesto o tiempo de respuesta"
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
        {isLoading && totalRows === 0 ? (
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 8 }}
          >
            <CircularProgress />
            <Typography>Cargando tiempos de respuesta...</Typography>
          </Stack>
        ) : (
          <ResponseTimeConfigurationTable
            rows={rows}
            totalCount={totalRows}
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
            onView={handleOpenViewForm}
            onEdit={handleOpenEditForm}
            onDelete={(row) => setDeleteTarget(row)}
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
              ? `Se eliminará la configuración ID: ${deleteTarget.id} del puesto "${deleteTarget.position?.name}".`
              : "Se eliminará la configuración seleccionada."}
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

export default TiemposDeRespuestaPage;
