"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { getHttpErrorMessage } from "@/utils/http-error";
import { personnelRequisitionsService } from "@/services";
import { useNotification, usePermissions } from "@/hooks";
import { AUTHORIZE_REQUEST, CREATE_REQUEST } from "@/constants";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SortDirection = "asc" | "desc" | null;
type FormMode = "create" | "edit" | "view" | null;

const PersonnelRequisitionPage = () => {
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const { error: notifyError } = useNotification();
  const { currentPermissions } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedViewIdRef = useRef<number | null>(null);

  const [requisitions, setRequisitions] = useState<PersonnelRequisition[]>([]);
  const [totalRequisitions, setTotalRequisitions] = useState(0);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingRequisitionId, setEditingRequisitionId] = useState<
    number | null
  >(null);
  const [editingRequisitionData, setEditingRequisitionData] =
    useState<PersonnelRequisition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonnelRequisition | null>(
    null,
  );
  const [authorizeTarget, setAuthorizeTarget] =
    useState<PersonnelRequisition | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
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
      notifyError(
        getHttpErrorMessage(err, "Error al cargar solicitudes de personal."),
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
    setFormMode("create");
    setEditingRequisitionId(null);
    setEditingRequisitionData(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode(null);
    setEditingRequisitionId(null);
    setEditingRequisitionData(null);

    if (searchParams.has("viewId")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("viewId");
      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
      openedViewIdRef.current = null;
    }
  };

  const handleOpenEditForm = async (id: number) => {
    try {
      const response = await personnelRequisitionsService.getById(id);
      setFormMode("edit");
      setEditingRequisitionId(id);
      setEditingRequisitionData(response.data);
      setIsFormOpen(true);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(
          err,
          "No fue posible cargar la solicitud para edición.",
        ),
      );
      console.error(err);
    }
  };

  const handleOpenViewForm = useCallback(
    async (id: number) => {
      try {
        const response = await personnelRequisitionsService.getById(id);
        setFormMode("view");
        setEditingRequisitionId(id);
        setEditingRequisitionData(response.data);
        setIsFormOpen(true);
      } catch (err) {
        notifyError(
          getHttpErrorMessage(
            err,
            "No fue posible cargar el detalle de la solicitud.",
          ),
        );
        console.error(err);
      }
    },
    [notifyError],
  );

  useEffect(() => {
    const viewIdRaw = searchParams.get("viewId");
    if (!viewIdRaw) {
      return;
    }

    const viewId = Number(viewIdRaw);
    if (!Number.isInteger(viewId) || viewId <= 0) {
      return;
    }

    if (openedViewIdRef.current === viewId) {
      return;
    }

    openedViewIdRef.current = viewId;
    void handleOpenViewForm(viewId);
  }, [searchParams, handleOpenViewForm]);

  const handleSaveRequisition = async (
    payload: CreatePersonnelRequisitionDto | UpdatePersonnelRequisitionDto,
  ) => {
    try {
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
      notifyError(getHttpErrorMessage(err, "Error al guardar la solicitud."));
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
      notifyError(getHttpErrorMessage(err, "Error al eliminar la solicitud."));
      console.error(err);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    handleDeleteRequisition(deleteTarget.id);
  };

  const handleAuthorizeRequisition = async (
    requisitionToAuthorize?: PersonnelRequisition | null,
  ) => {
    const target = requisitionToAuthorize ?? authorizeTarget;

    if (!target) {
      return;
    }

    try {
      setIsAuthorizing(true);

      await personnelRequisitionsService.createAuthorizationRequest({
        requisitionId: target.id,
      });

      setAuthorizeTarget(null);
      setEditingRequisitionData((current) =>
        current && current.id === target.id
          ? { ...current, isAuthorized: true }
          : current,
      );
      await loadRequisitions();
      setSuccessMessage("Solicitud autorizada exitosamente");

      if (isFormOpen) {
        closeForm();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al autorizar la solicitud."));
      console.error(err);
    } finally {
      setIsAuthorizing(false);
    }
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
      <PersonnelRequisitionForm
        isEditing={formMode === "edit"}
        isReadOnly={formMode === "view"}
        isAuthorizing={isAuthorizing}
        canAuthorize={
          formMode === "view" &&
          currentPermissions.includes(AUTHORIZE_REQUEST) &&
          !editingRequisitionData?.isAuthorized
        }
        initialData={editingRequisitionData ?? undefined}
        onAuthorize={() =>
          void handleAuthorizeRequisition(editingRequisitionData)
        }
        onCancel={closeForm}
        onSubmit={handleSaveRequisition}
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      {/* Alerts */}
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
          {currentPermissions.includes(CREATE_REQUEST) && (
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
          )}

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
            onView={handleOpenViewForm}
            onEdit={handleOpenEditForm}
            onDelete={(requisition) => setDeleteTarget(requisition)}
            onAuthorize={(requisition) => setAuthorizeTarget(requisition)}
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

      <Dialog
        open={Boolean(authorizeTarget)}
        onClose={() => setAuthorizeTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirmar autorización
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {authorizeTarget
              ? `Se autorizará la solicitud de personal ID: ${authorizeTarget.id} del área "${authorizeTarget.area?.name}".`
              : "Se autorizará la solicitud de personal seleccionada."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAuthorizeTarget(null)}
            sx={{ color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => void handleAuthorizeRequisition()}
            disabled={isAuthorizing}
            sx={{ borderRadius: "10px" }}
          >
            {isAuthorizing ? "Autorizando..." : "Autorizar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default PersonnelRequisitionPage;
