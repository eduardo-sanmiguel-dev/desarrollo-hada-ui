"use client";

import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import { PersonnelRequisitionForm } from "./components/personnel-requisition-form";
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
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
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

type SortField = "id" | "requestDate" | "numberOfVacancies" | "isExternal";
type SortDirection = "asc" | "desc" | null;

const PersonnelRequisitionPage = () => {
  const { mode, systemMode } = useColorScheme();
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const darkRowEven = alpha(APP_COLORS.surface, 0.04);
  const darkRowOdd = alpha(APP_COLORS.surface, 0.08);

  const [requisitions, setRequisitions] = useState<PersonnelRequisition[]>([]);

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
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load requisitions on component mount
  useEffect(() => {
    loadRequisitions();
  }, []);

  const loadRequisitions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await personnelRequisitionsService.getAll();
      setRequisitions(response.data);
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
  };

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

  const openCreateForm = () => {
    setEditingRequisitionId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (requisition: PersonnelRequisition) => {
    setEditingRequisitionId(requisition.id);
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
        const response = await personnelRequisitionsService.update(
          editingRequisitionId,
          payload as UpdatePersonnelRequisitionDto,
        );
        setRequisitions((current) =>
          current.map((req) =>
            req.id === editingRequisitionId ? response.data : req,
          ),
        );
        setSuccessMessage("Solicitud actualizada exitosamente");
      } else {
        // Create new
        const response = await personnelRequisitionsService.create(
          payload as CreatePersonnelRequisitionDto,
        );
        setRequisitions((current) => [response.data, ...current]);
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
      setRequisitions((current) => current.filter((req) => req.id !== id));
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

  const requestDeleteRequisition = (requisition: PersonnelRequisition) => {
    setDeleteTarget(requisition);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    handleDeleteRequisition(deleteTarget.id);
  };

  const filteredAndSortedRequisitions = useMemo(() => {
    const normalizedTerm = debouncedSearchTerm.toLowerCase().trim();

    const filtered = requisitions.filter((requisition) => {
      if (!normalizedTerm) {
        return true;
      }

      const matchesId = String(requisition.id).includes(normalizedTerm);
      const matchesArea = requisition.area?.name
        .toLowerCase()
        .includes(normalizedTerm);
      const matchesWorkplace = requisition.workplace?.name
        .toLowerCase()
        .includes(normalizedTerm);
      const matchesPosition = requisition.positionRequired?.name
        .toLowerCase()
        .includes(normalizedTerm);

      return matchesId || matchesArea || matchesWorkplace || matchesPosition;
    });

    if (!sortField || !sortDirection) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "id") {
        return a.id - b.id;
      }

      if (sortField === "requestDate") {
        const dateA = new Date(a.requestDate).getTime();
        const dateB = new Date(b.requestDate).getTime();
        return dateA - dateB;
      }

      if (sortField === "numberOfVacancies") {
        return a.numberOfVacancies - b.numberOfVacancies;
      }

      if (sortField === "isExternal") {
        return a.isExternal === b.isExternal ? 0 : a.isExternal ? 1 : -1;
      }

      return 0;
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [requisitions, debouncedSearchTerm, sortField, sortDirection]);

  const paginatedRequisitions = useMemo(() => {
    if (rowsPerPage === -1) {
      return filteredAndSortedRequisitions;
    }

    const start = page * rowsPerPage;
    return filteredAndSortedRequisitions.slice(start, start + rowsPerPage);
  }, [filteredAndSortedRequisitions, page, rowsPerPage]);

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
            Solicitudes de Personal
          </Typography>
          <Chip
            label={`${requisitions.length} solicitudes`}
            size="small"
            sx={{
              bgcolor: alpha(APP_COLORS.primary, 0.14),
              border: `1px solid ${alpha(APP_COLORS.primary, 0.28)}`,
              fontWeight: 700,
            }}
          />
        </Stack>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Gestiona las solicitudes de personal: crear, editar, eliminar, filtrar
          y listar.
        </Typography>
      </Box>

      {/* Loading State */}
      {isLoading ? (
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
        <>
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
                  placeholder="Buscar por ID, área, centro de trabajo o puesto"
                  size="small"
                  value={searchTerm}
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
                Crear Solicitud
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={loadRequisitions}
                sx={{
                  borderRadius: "12px",
                  borderColor: alpha(APP_COLORS.primary, 0.35),
                  color: "text.primary",
                }}
              >
                Refrescar
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
            <Table
              size="small"
              sx={{
                "& .MuiTableCell-root": {
                  borderBottom: `1px solid ${
                    isDarkMode
                      ? alpha(APP_COLORS.surface, 0.1)
                      : alpha(APP_COLORS.secondary, 0.12)
                  }`,
                },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: APP_COLORS.primary,
                    "& .MuiTableCell-root": {
                      color: APP_COLORS.surface,
                      borderBottom: "none",
                      py: 1.7,
                    },
                  }}
                >
                  {[
                    { key: "id", label: "ID" },
                    { key: "requestDate", label: "Fecha" },
                    { key: "numberOfVacancies", label: "Vacantes" },
                    { key: "isExternal", label: "Tipo" },
                  ].map((column) => (
                    <TableCell key={column.key} sx={{ fontWeight: 700 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: APP_COLORS.surface,
                          }}
                        >
                          {column.label}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleSortToggle(column.key as SortField)
                          }
                          sx={{
                            width: 24,
                            height: 24,
                            color: alpha(APP_COLORS.surface, 0.9),
                          }}
                        >
                          <SwapVertRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                        {sortLabel(column.key as SortField) !== "null" && (
                          <Chip
                            label={sortLabel(column.key as SortField)}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              bgcolor: alpha(APP_COLORS.surface, 0.18),
                              color: APP_COLORS.surface,
                              border: `1px solid ${alpha(APP_COLORS.surface, 0.26)}`,
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 700 }}>Área</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedRequisitions.map((requisition, index) => (
                  <TableRow
                    key={requisition.id}
                    hover
                    sx={{
                      backgroundColor:
                        index % 2 === 0
                          ? isDarkMode
                            ? darkRowEven
                            : alpha(APP_COLORS.surface, 0.98)
                          : isDarkMode
                            ? darkRowOdd
                            : "#F3F4F3",
                      "& .MuiTableCell-root": {
                        color: isDarkMode
                          ? alpha(APP_COLORS.surface, 0.94)
                          : "text.primary",
                      },
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? alpha(APP_COLORS.surface, 0.12)
                          : undefined,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography component="span" sx={{ fontSize: 14 }}>
                        {renderHighlightedText(requisition.id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography component="span" sx={{ fontSize: 14 }}>
                        {renderHighlightedText(
                          new Date(requisition.requestDate).toLocaleDateString(
                            "es-ES",
                          ),
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography component="span" sx={{ fontSize: 14 }}>
                        {renderHighlightedText(requisition.numberOfVacancies)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={requisition.isExternal ? "Externa" : "Interna"}
                        size="small"
                        variant="outlined"
                        sx={{
                          bgcolor: requisition.isExternal
                            ? alpha(APP_COLORS.primary, 0.1)
                            : alpha(APP_COLORS.secondary, 0.1),
                          borderColor: requisition.isExternal
                            ? alpha(APP_COLORS.primary, 0.5)
                            : alpha(APP_COLORS.secondary, 0.5),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography component="span" sx={{ fontSize: 13 }}>
                        {renderHighlightedText(requisition.area?.name ?? "—")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => openEditForm(requisition)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => requestDeleteRequisition(requisition)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {paginatedRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box
                        sx={{
                          py: 3,
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        {filteredAndSortedRequisitions.length === 0 &&
                        debouncedSearchTerm
                          ? "No hay solicitudes que coincidan con la búsqueda."
                          : "No hay solicitudes de personal para mostrar."}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={filteredAndSortedRequisitions.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20, { label: "Todos", value: -1 }]}
              labelRowsPerPage="Filas por página"
              showFirstButton
              showLastButton
            />
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
        </>
      )}
    </Stack>
  );
};

export default PersonnelRequisitionPage;
