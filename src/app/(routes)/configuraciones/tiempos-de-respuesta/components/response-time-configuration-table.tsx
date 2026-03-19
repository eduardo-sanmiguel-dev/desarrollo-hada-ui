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
import { ResponseTimeConfiguration } from "@/types/response-time-configuration.types";

export type SortField = "id" | "position" | "responseTimeInDays" | "createdAt";

type ResponseTimeConfigurationTableProps = {
  rows: ResponseTimeConfiguration[];
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
  onDelete: (row: ResponseTimeConfiguration) => void;
};

export const ResponseTimeConfigurationTable = ({
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
}: ResponseTimeConfigurationTableProps) => {
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
            {[
              { key: "id", label: "ID" },
              { key: "position", label: "Puesto" },
              {
                key: "responseTimeInDays",
                label: "Tiempo de respuesta (días)",
              },
              { key: "createdAt", label: "Fecha de creación" },
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
                    onClick={() => onSortToggle(column.key as SortField)}
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
                  {renderHighlightedText(row.id)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography component="span" sx={{ fontSize: 14 }}>
                  {renderHighlightedText(row.position?.name ?? "-")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography component="span" sx={{ fontSize: 14 }}>
                  {renderHighlightedText(row.responseTimeInDays)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography component="span" sx={{ fontSize: 14 }}>
                  {renderHighlightedText(
                    row.createdAt
                      ? new Date(row.createdAt).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "-",
                  )}
                </Typography>
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
                      aria-label={`Ver configuración ${row.id}`}
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
                      aria-label={`Editar configuración ${row.id}`}
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
                      aria-label={`Eliminar configuración ${row.id}`}
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
              <TableCell colSpan={5}>
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  {totalCount === 0 && hasSearchTerm
                    ? "No hay configuraciones que coincidan con la búsqueda."
                    : "No hay tiempos de respuesta para mostrar."}
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
        labelRowsPerPage="Filas por página"
        showFirstButton
        showLastButton
      />
    </>
  );
};
