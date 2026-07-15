"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
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
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useNotification } from "@/hooks";
import { usersService } from "@/services/users.service";
import { APP_COLORS } from "@/theme/tokens";
import { AppUser, CreateUserDto, UpdateUserDto } from "@/types/user.types";
import { getHttpErrorMessage } from "@/utils/http-error";

type FormMode = "create" | "edit" | "view";

type UserFormState = {
  code: string;
  name: string;
  email: string;
  password: string;
};

const EMPTY_FORM: UserFormState = {
  code: "",
  name: "",
  email: "",
  password: "",
};

const extractUsers = (payload: unknown): AppUser[] => {
  if (Array.isArray(payload)) {
    return payload as AppUser[];
  }

  if (payload && typeof payload === "object") {
    const maybeItems = (payload as { items?: unknown }).items;

    if (Array.isArray(maybeItems)) {
      return maybeItems as AppUser[];
    }
  }

  return [];
};

const UsuariosPage = () => {
  const { error: notifyError } = useNotification();

  const [rows, setRows] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formState, setFormState] = useState<UserFormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRows = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await usersService.getAll();
      setRows(extractUsers(response.data));
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al cargar usuarios."));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const sourceRows = Array.isArray(rows) ? rows : [];
    const query = debouncedSearchTerm.trim().toLowerCase();

    if (!query) {
      return sourceRows;
    }

    return sourceRows.filter((row) => {
      const searchableValues = [String(row.code), row.name, row.email];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [rows, debouncedSearchTerm]);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingUserId(null);
    setFormState(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const handleOpenForm = async (mode: FormMode, id: number) => {
    try {
      const response = await usersService.getById(id);
      const user = response.data;

      setFormMode(mode);
      setEditingUserId(id);
      setFormState({
        code: String(user.code ?? ""),
        name: user.name ?? "",
        email: user.email ?? "",
        password: "",
      });
      setIsFormOpen(true);
    } catch (err) {
      notifyError(
        getHttpErrorMessage(err, "No fue posible cargar el usuario."),
      );
      console.error(err);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode("create");
    setEditingUserId(null);
    setFormState(EMPTY_FORM);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadRows();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    const code = Number(formState.code);
    const name = formState.name.trim();
    const email = formState.email.trim().toLowerCase();
    const password = formState.password;

    if (!Number.isFinite(code) || code <= 0) {
      notifyError("El codigo debe ser un numero mayor a 0.");
      return;
    }

    if (!name || !email) {
      notifyError("Nombre y correo son obligatorios.");
      return;
    }

    if (formMode === "create" && password.trim().length < 4) {
      notifyError("La contrasena debe tener al menos 4 caracteres.");
      return;
    }

    try {
      if (editingUserId !== null) {
        const payload: UpdateUserDto = { code, name, email };

        if (password.trim()) {
          payload.password = password;
        }

        await usersService.update(editingUserId, payload);
        setSuccessMessage("Usuario actualizado exitosamente");
      } else {
        const payload: CreateUserDto = {
          code,
          name,
          email,
          password,
        };

        await usersService.create(payload);
        setSuccessMessage("Usuario creado exitosamente");
      }

      await loadRows();
      closeForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al guardar usuario."));
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await usersService.delete(deleteTarget.id);
      await loadRows();
      setDeleteTarget(null);
      setSuccessMessage("Usuario eliminado exitosamente");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "Error al eliminar usuario."));
      console.error(err);
    }
  };

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
            Usuarios
          </Typography>
          <Chip
            label={`${filteredRows.length} registros`}
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
              placeholder="Buscar por codigo, nombre o correo"
              size="small"
              value={searchTerm}
              autoComplete="off"
              onChange={(event) => {
                setSearchTerm(event.target.value);
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
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
        {isLoading ? (
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 8 }}
          >
            <CircularProgress />
            <Typography>Cargando usuarios...</Typography>
          </Stack>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Codigo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Correo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography sx={{ py: 2, textAlign: "center" }}>
                        No hay usuarios para mostrar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.25}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Ver">
                            <IconButton
                              size="small"
                              onClick={() =>
                                void handleOpenForm("view", row.id)
                              }
                            >
                              <VisibilityRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() =>
                                void handleOpenForm("edit", row.id)
                              }
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={isFormOpen} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {formMode === "create"
            ? "Crear usuario"
            : formMode === "edit"
              ? "Editar usuario"
              : "Detalle de usuario"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Codigo"
              type="number"
              value={formState.code}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, code: event.target.value }))
              }
              disabled={formMode === "view"}
              required
              fullWidth
            />
            <TextField
              label="Nombre"
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
              disabled={formMode === "view"}
              required
              fullWidth
            />
            <TextField
              label="Correo"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
              disabled={formMode === "view"}
              required
              fullWidth
            />
            {formMode !== "view" ? (
              <TextField
                label={
                  formMode === "create" ? "Contrasena" : "Contrasena (opcional)"
                }
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                required={formMode === "create"}
                helperText={
                  formMode === "create"
                    ? "Minimo 4 caracteres"
                    : "Completa solo si deseas cambiarla"
                }
                fullWidth
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeForm} sx={{ color: "text.secondary" }}>
            {formMode === "view" ? "Cerrar" : "Cancelar"}
          </Button>
          {formMode !== "view" ? (
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              sx={{ borderRadius: "10px" }}
            >
              Guardar
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

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
              ? `Se eliminara el usuario ${deleteTarget.name} con codigo ${deleteTarget.code}.`
              : "Se eliminara el usuario seleccionado."}
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
            onClick={() => void handleDelete()}
            sx={{ borderRadius: "10px" }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default UsuariosPage;
