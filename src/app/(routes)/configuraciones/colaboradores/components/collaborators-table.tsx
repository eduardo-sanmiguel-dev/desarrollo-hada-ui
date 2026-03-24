import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

import { APP_COLORS } from "@/theme/tokens";
import { Collaborator } from "@/types/collaborator.types";

export type SortField =
  | "id"
  | "code"
  | "name"
  | "area"
  | "position"
  | "gender"
  | "birthdate"
  | "dateOfAdmission"
  | "personnelRequisition"
  | "createdAt";

type CollaboratorsTableProps = {
  rows: Collaborator[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  isDarkMode: boolean;
  onSortToggle: (field: SortField) => void;
  sortLabel: (field: SortField) => string;
  onPageChange: (nextPage: number) => void;
  onRowsPerPageChange: (nextRowsPerPage: number) => void;
  renderHighlightedText: (value: string | number) => ReactNode;
  hasSearchTerm: boolean;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (row: Collaborator) => void;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getRequisitionLabel = (row: Collaborator) => {
  if (!row.personnelRequisition) {
    return "-";
  }

  const id = row.personnelRequisition.id;
  const position = row.personnelRequisition.positionRequired?.name;

  return position ? `#${id} - ${position}` : `#${id}`;
};

export const CollaboratorsTable = ({
  rows,
  totalCount,
  page,
  rowsPerPage,
  isDarkMode,
  onSortToggle,
  sortLabel,
  onPageChange,
  onRowsPerPageChange,
  renderHighlightedText,
  hasSearchTerm,
  onView,
  onEdit,
  onDelete,
}: CollaboratorsTableProps) => {
  const columns: Array<{ key: SortField; label: string }> = [
    { key: "id", label: "ID" },
    { key: "code", label: "Codigo" },
    { key: "name", label: "Nombre" },
    { key: "area", label: "Area" },
    { key: "position", label: "Posicion" },
    { key: "gender", label: "Genero" },
    { key: "birthdate", label: "F. nacimiento" },
    { key: "dateOfAdmission", label: "F. ingreso" },
    { key: "personnelRequisition", label: "Req. personal" },
    { key: "createdAt", label: "Creado" },
  ];

  return (
    <>
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
            {columns.map((column) => (
              <TableCell key={column.key} sx={{ fontWeight: 700 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: APP_COLORS.surface,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {column.label}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => onSortToggle(column.key)}
                    sx={{
                      width: 24,
                      height: 24,
                      color: alpha(APP_COLORS.surface, 0.9),
                    }}
                  >
                    <SwapVertRoundedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                  {sortLabel(column.key) !== "null" && (
                    <Chip
                      label={sortLabel(column.key)}
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
            <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: APP_COLORS.surface,
                }}
              >
                Acciones
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{
                "& .MuiTableCell-root": {
                  color: isDarkMode
                    ? alpha(APP_COLORS.surface, 0.94)
                    : "text.primary",
                  whiteSpace: "nowrap",
                },
                "&:hover": {
                  backgroundColor: isDarkMode
                    ? alpha(APP_COLORS.surface, 0.12)
                    : undefined,
                },
              }}
            >
              <TableCell>{renderHighlightedText(row.id)}</TableCell>
              <TableCell>{renderHighlightedText(row.code)}</TableCell>
              <TableCell>{renderHighlightedText(row.name)}</TableCell>
              <TableCell>
                {renderHighlightedText(row.area?.name ?? "-")}
              </TableCell>
              <TableCell>
                {renderHighlightedText(row.position?.name ?? "-")}
              </TableCell>
              <TableCell>
                {renderHighlightedText(row.gender?.name ?? "-")}
              </TableCell>
              <TableCell>
                {renderHighlightedText(formatDate(row.birthdate))}
              </TableCell>
              <TableCell>
                {renderHighlightedText(formatDate(row.dateOfAdmission))}
              </TableCell>
              <TableCell>
                {renderHighlightedText(getRequisitionLabel(row))}
              </TableCell>
              <TableCell>
                {renderHighlightedText(formatDate(row.createdAt))}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Ver" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onView(row.id)}
                      sx={{
                        color: "info.main",
                        borderRadius: "8px",
                        border: `1px solid ${alpha(APP_COLORS.secondary, 0.3)}`,
                        backgroundColor: alpha(APP_COLORS.surface, 0.04),
                        width: 30,
                        height: 30,
                        "&:hover": {
                          backgroundColor: alpha(APP_COLORS.secondary, 0.14),
                        },
                      }}
                      aria-label={`Ver colaborador ${row.id}`}
                    >
                      <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(row.id)}
                      sx={{
                        color: alpha(APP_COLORS.primary, 0.95),
                        borderRadius: "8px",
                        border: `1px solid ${alpha(APP_COLORS.primary, 0.34)}`,
                        backgroundColor: alpha(APP_COLORS.primary, 0.06),
                        width: 30,
                        height: 30,
                        "&:hover": {
                          backgroundColor: alpha(APP_COLORS.primary, 0.14),
                        },
                      }}
                      aria-label={`Editar colaborador ${row.id}`}
                    >
                      <EditRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(row)}
                      sx={{
                        color: "error.main",
                        borderRadius: "8px",
                        border: `1px solid ${alpha(APP_COLORS.secondary, 0.3)}`,
                        backgroundColor: alpha(APP_COLORS.secondary, 0.04),
                        width: 30,
                        height: 30,
                        "&:hover": {
                          backgroundColor: alpha(APP_COLORS.secondary, 0.12),
                        },
                      }}
                      aria-label={`Eliminar colaborador ${row.id}`}
                    >
                      <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11}>
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  {totalCount === 0 && hasSearchTerm
                    ? "No hay colaboradores que coincidan con la busqueda."
                    : "No hay colaboradores para mostrar."}
                </Box>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange(Number(event.target.value));
        }}
        rowsPerPageOptions={[5, 10, 20, { label: "Todos", value: -1 }]}
        labelRowsPerPage="Filas por pagina"
        showFirstButton
        showLastButton
      />
    </>
  );
};
