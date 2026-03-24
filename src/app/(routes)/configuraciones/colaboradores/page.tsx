"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
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
} from "@mui/material";
import { alpha, useColorScheme } from "@mui/material/styles";

import { CollaboratorForm } from "@/app/(routes)/configuraciones/colaboradores/components/collaborator-form";
import {
  CollaboratorsTable,
  SortField,
} from "@/app/(routes)/configuraciones/colaboradores/components/collaborators-table";
import { useNotification } from "@/hooks";
import { collaboratorsService } from "@/services/collaborators.service";
import { APP_COLORS } from "@/theme/tokens";
import {
  Collaborator,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from "@/types/collaborator.types";
import { getHttpErrorMessage } from "@/utils/http-error";

type SortDirection = "asc" | "desc" | null;
type FormMode = "create" | "edit" | "view" | null;

const dateAsTime = (value?: string | Date | null) => {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const requisitionLabel = (row: Collaborator) => {
  if (!row.personnelRequisition) {
    return "";
  }

  const requisitionId = row.personnelRequisition.id;
  const position = row.personnelRequisition.positionRequired?.name ?? "";
  return `${requisitionId} ${position}`.trim();
};

const ColaboradoresPage = () => {
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const { error: notifyError } = useNotification();

  const [rows, setRows] = useState<Collaborator[]>([]);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<Collaborator | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Collaborator | null>(null);

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
      const response = await collaboratorsService.getAll();
      setRows(response.data);
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al cargar colaboradores."));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const searchableValues = [
        String(row.id),
        String(row.code),
        row.name,
        row.area?.name ?? "",
        row.position?.name ?? "",
        row.gender?.name ?? "",
        requisitionLabel(row),
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [rows, debouncedSearchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortField || !sortDirection) {
      return filteredRows;
    }

    const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    return [...filteredRows].sort((a, b) => {
      let left: string | number = "";
      let right: string | number = "";

      switch (sortField) {
        case "id":
          left = a.id;
          right = b.id;
          break;
        case "code":
          left = Number(a.code ?? 0);
          right = Number(b.code ?? 0);
          break;
        case "name":
          left = a.name ?? "";
          right = b.name ?? "";
          break;
        case "area":
          left = a.area?.name ?? "";
          right = b.area?.name ?? "";
          break;
        case "position":
          left = a.position?.name ?? "";
          right = b.position?.name ?? "";
          break;
        case "gender":
          left = a.gender?.name ?? "";
          right = b.gender?.name ?? "";
          break;
        case "birthdate":
          left = dateAsTime(a.birthdate);
          right = dateAsTime(b.birthdate);
          break;
        case "dateOfAdmission":
          left = dateAsTime(a.dateOfAdmission);
          right = dateAsTime(b.dateOfAdmission);
          break;
        case "personnelRequisition":
          left = requisitionLabel(a);
          right = requisitionLabel(b);
          break;
        case "createdAt":
          left = dateAsTime(a.createdAt);
          right = dateAsTime(b.createdAt);
          break;
        default:
          break;
      }

      if (typeof left === "number" && typeof right === "number") {
        if (left === right) {
          return 0;
        }

        return left > right ? directionMultiplier : -directionMultiplier;
      }

      const compare = String(left).localeCompare(String(right), "es", {
        sensitivity: "base",
      });

      return compare * directionMultiplier;
    });
  }, [filteredRows, sortDirection, sortField]);

  const totalRows = sortedRows.length;

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) {
      return sortedRows;
    }

    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedRows]);

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
      const response = await collaboratorsService.getById(id);
      setFormMode("edit");
      setEditingRowId(id);
      setEditingRowData(response.data);
      setIsFormOpen(true);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "No fue posible cargar el colaborador."),
      );
      console.error(err);
    }
  };

  const handleOpenViewForm = async (id: number) => {
    try {
      const response = await collaboratorsService.getById(id);
      setFormMode("view");
      setEditingRowId(id);
      setEditingRowData(response.data);
      setIsFormOpen(true);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(
          err,
          "No fue posible cargar el detalle del colaborador.",
        ),
      );
      console.error(err);
    }
  };

  const handleSave = async (
    payload: CreateCollaboratorDto | UpdateCollaboratorDto,
  ) => {
    try {
      if (editingRowId !== null) {
        await collaboratorsService.update(
          editingRowId,
          payload as UpdateCollaboratorDto,
        );
        await loadRows();
        setSuccessMessage("Colaborador actualizado exitosamente");
      } else {
        await collaboratorsService.create(payload as CreateCollaboratorDto);
        setPage(0);
        await loadRows();
        setSuccessMessage("Colaborador creado exitosamente");
      }

      closeForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al guardar colaborador."));
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await collaboratorsService.delete(id);
      await loadRows();
      setDeleteTarget(null);
      setSuccessMessage("Colaborador eliminado exitosamente");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al eliminar colaborador."));
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

  useEffect(() => {
    if (rowsPerPage !== -1) {
      const maxPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);

      if (page > maxPage) {
        setPage(maxPage);
      }
    }
  }, [page, rowsPerPage, totalRows]);

  if (isFormOpen) {
    return (
      <CollaboratorForm
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
            Colaboradores
          </Typography>
          <Chip
            label={`${totalRows} registros`}
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
              placeholder="Buscar por codigo, nombre, area, posicion o genero"
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
            <Typography>Cargando colaboradores...</Typography>
          </Stack>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <CollaboratorsTable
              rows={paginatedRows}
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
          </Box>
        )}
      </Card>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirmar eliminacion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `Se eliminara el colaborador ${deleteTarget.name} con codigo ${deleteTarget.code}.`
              : "Se eliminara el colaborador seleccionado."}
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

export default ColaboradoresPage;
