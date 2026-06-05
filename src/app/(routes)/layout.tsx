"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeModeSwitcher } from "@/components/theme-mode-switcher";
import { authService } from "@/services";
import { useNotification } from "@/hooks";
import { useAuthStore } from "@/stores/auth.store";
import { APP_COLORS } from "@/theme/tokens";
import { getHttpErrorMessage } from "@/utils/http-error";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useColorScheme, useTheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import axios from "axios";
import { usePermissions } from "@/hooks";

const drawerWidthExpanded = 292;
const drawerWidthCollapsed = 88;

type MenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  enabled: boolean;
  children?: Array<{
    label: string;
    href: string;
    enabled: boolean;
    icon: React.ReactNode;
  }>;
};

const menuItems: ReadonlyArray<MenuItem> = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <SpaceDashboardRoundedIcon fontSize="small" />,
    enabled: true,
  },
  {
    label: "Requisicion de Personal",
    href: "/requisicion-de-personal",
    icon: <PersonAddAlt1RoundedIcon fontSize="small" />,
    enabled: true,
  },
  {
    label: "Reporte incumplimientos",
    href: "/reporte-incumplimientos",
    icon: <ReportProblemRoundedIcon fontSize="small" />,
    enabled: true,
  },
  {
    label: "Configuraciones",
    href: "/configuraciones",
    icon: <SettingsRoundedIcon fontSize="small" />,
    enabled: true,
    children: [
      {
        label: "Colaboradores",
        href: "/configuraciones/colaboradores",
        enabled: true,
        icon: <ManageAccountsRoundedIcon sx={{ fontSize: 18 }} />,
      },
      {
        label: "Tiempos de respuesta",
        href: "/configuraciones/tiempos-de-respuesta",
        enabled: true,
        icon: <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />,
      },
    ],
  },
  {
    label: "Talento y Cultura",
    href: "/2",
    icon: <Groups2RoundedIcon fontSize="small" />,
    enabled: false,
  },
  {
    label: "Nomina y Compensaciones",
    href: "/2",
    icon: <Inventory2RoundedIcon fontSize="small" />,
    enabled: false,
  },
  {
    label: "Reclutamiento y Seleccion",
    href: "/2",
    icon: <LocalShippingRoundedIcon fontSize="small" />,
    enabled: false,
  },

  {
    label: "Analitica de Personas",
    href: "/2",
    icon: <InsightsRoundedIcon fontSize="small" />,
    enabled: false,
  },
];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const effectiveMode = mode === "system" ? systemMode : mode;
  const isDarkMode = effectiveMode === "dark";
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const { isSessionReady, user, userId, setSession, clearSession } =
    useAuthStore();
  const { error: notifyError } = useNotification();
  const { enabledRoutes } = usePermissions();

  const userName = user?.name ?? "";

  const userInitials = useMemo(() => {
    if (!userName) {
      return "CT";
    }

    return userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [userName]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await authService.checkToken();
        setSession({
          userId: response.data.userId,
          user: response.data.user,
        });
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : null;

        if (status !== 401) {
          notifyError(
            getHttpErrorMessage(err, "No fue posible validar tu sesion."),
          );
        }

        clearSession();
        router.replace("/");
      }
    };

    if (!isSessionReady) {
      void loadSession();
    }
  }, [clearSession, isSessionReady, notifyError, router, setSession]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      notifyError(getHttpErrorMessage(err, "No fue posible cerrar sesion."));
    } finally {
      clearSession();
      router.replace("/");
      router.refresh();
    }
  };

  const shellBg = isDarkMode ? "#171C18" : APP_COLORS.primary;
  const shellText = APP_COLORS.surface;
  const shellMutedText = isDarkMode
    ? alpha(APP_COLORS.surface, 0.82)
    : alpha(APP_COLORS.surface, 0.84);
  const menuText = isDarkMode ? APP_COLORS.surface : shellText;
  const menuMutedText = isDarkMode
    ? alpha(APP_COLORS.surface, 0.82)
    : shellMutedText;
  const desktopDrawerWidth = isMenuExpanded
    ? drawerWidthExpanded
    : drawerWidthCollapsed;
  const activeDrawerWidth = isDesktop
    ? desktopDrawerWidth
    : drawerWidthExpanded;

  const hasAccessToRoute = (route: string) =>
    enabledRoutes.some(
      (enabledRoute) =>
        enabledRoute === route || enabledRoute.startsWith(`${route}/`),
    );

  useEffect(() => {
    setIsConfigMenuOpen(pathname.startsWith("/configuraciones"));
  }, [pathname]);

  const menu = (
    <Box
      sx={{
        height: "100%",
        p: isMenuExpanded ? 2 : 1.25,
        display: "flex",
        flexDirection: "column",
        backgroundColor: shellBg,
        color: menuText,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          right: -86,
          bottom: -94,
          width: 210,
          height: 210,
          borderRadius: "50%",
          border: `1px dashed ${alpha(APP_COLORS.surface, 0.34)}`,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isMenuExpanded ? "flex-start" : "center",
          justifyContent: "center",
          border: `1px solid ${isDarkMode ? alpha(APP_COLORS.primary, 0.4) : alpha(APP_COLORS.surface, 0.42)}`,
          borderRadius: 1,
          p: isMenuExpanded ? 1.5 : 1,
          backgroundColor: isDarkMode
            ? alpha(APP_COLORS.primary, 0.1)
            : alpha(APP_COLORS.surface, 0.14),
          color: menuText,
          boxShadow: "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: menuMutedText,
            letterSpacing: 1,
            fontWeight: 700,
            display: isMenuExpanded ? "block" : "none",
          }}
        >
          COSMETICOS TRUJILLO
        </Typography>
        <Typography
          variant={isMenuExpanded ? "h6" : "subtitle2"}
          sx={{
            mt: isMenuExpanded ? 0.5 : 0,
            fontWeight: 800,
            color: menuText,
            textAlign: isMenuExpanded ? "left" : "center",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isMenuExpanded ? "Capital Humano" : "CH"}
        </Typography>
      </Box>

      <List sx={{ mt: 2, gap: 0.5, display: "grid" }}>
        {menuItems
          .filter((item) => {
            if (!item.enabled) {
              return true;
            }

            if (item.children?.length) {
              return (
                hasAccessToRoute(item.href) ||
                item.children.some((child) =>
                  child.enabled ? hasAccessToRoute(child.href) : true,
                )
              );
            }

            return hasAccessToRoute(item.href);
          })
          .map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isChildRouteActive =
              hasChildren && pathname.startsWith(`${item.href}/`);
            const isActive = pathname === item.href || isChildRouteActive;
            const visibleChildren =
              item.children?.filter((child) =>
                child.enabled ? hasAccessToRoute(child.href) : true,
              ) ?? [];

            return (
              <Box key={item.label}>
                <Tooltip
                  key={`${item.label}-${isMenuExpanded ? "expanded" : "compact"}`}
                  title={item.label}
                  placement="right"
                  arrow
                  disableInteractive
                  disableHoverListener={isMenuExpanded}
                  disableFocusListener={isMenuExpanded}
                  disableTouchListener={isMenuExpanded}
                >
                  <Box
                    component="span"
                    sx={{ display: "block", width: "100%" }}
                  >
                    <ListItemButton
                      component={item.enabled && !hasChildren ? Link : "button"}
                      href={
                        item.enabled && !hasChildren ? item.href : undefined
                      }
                      disabled={!item.enabled}
                      onClick={() => {
                        if (hasChildren) {
                          if (!isMenuExpanded) {
                            setIsMenuExpanded(true);
                            setIsConfigMenuOpen(true);
                            return;
                          }

                          setIsConfigMenuOpen((prev) => !prev);
                          return;
                        }

                        if (!isDesktop) {
                          setMobileDrawerOpen(false);
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        width: "100%",
                        color: menuText,
                        border: "1px solid transparent",
                        justifyContent: isMenuExpanded
                          ? "flex-start"
                          : "center",
                        backgroundColor: isActive
                          ? isDarkMode
                            ? alpha(APP_COLORS.primary, 0.16)
                            : alpha(APP_COLORS.surface, 0.22)
                          : "transparent",
                        borderColor: isActive
                          ? isDarkMode
                            ? alpha(APP_COLORS.primary, 0.36)
                            : alpha(APP_COLORS.surface, 0.42)
                          : "transparent",
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? alpha(APP_COLORS.primary, 0.1)
                            : alpha(APP_COLORS.surface, 0.14),
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${
                            isDarkMode
                              ? alpha(APP_COLORS.primary, 0.82)
                              : alpha(APP_COLORS.surface, 0.86)
                          }`,
                          outlineOffset: 2,
                        },
                        "&.Mui-disabled": {
                          opacity: 1,
                          color: menuMutedText,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: "inherit",
                          minWidth: isMenuExpanded ? 34 : 0,
                          mr: isMenuExpanded ? 0 : 0,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {isMenuExpanded ? (
                        <ListItemText
                          primary={item.label}
                          sx={{ mr: 1 }}
                          primaryTypographyProps={{
                            sx: {
                              color: "inherit",
                              fontWeight: isActive ? 700 : 500,
                              lineHeight: 1.2,
                            },
                          }}
                        />
                      ) : null}
                      {isMenuExpanded ? (
                        <Box
                          sx={{
                            ml: "auto",
                            minWidth: 46,
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {hasChildren ? (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                color: alpha(menuText, 0.9),
                              }}
                            >
                              {isConfigMenuOpen ? (
                                <ExpandLessRoundedIcon fontSize="small" />
                              ) : (
                                <ExpandMoreRoundedIcon fontSize="small" />
                              )}
                            </Box>
                          ) : null}
                          {!item.enabled ? (
                            <Chip
                              size="small"
                              label="Prox"
                              sx={{
                                height: 22,
                                fontSize: 10,
                                fontWeight: 700,
                                backgroundColor: isDarkMode
                                  ? alpha(APP_COLORS.primary, 0.18)
                                  : alpha(APP_COLORS.surface, 0.2),
                                color: menuText,
                                border: `1px solid ${
                                  isDarkMode
                                    ? alpha(APP_COLORS.primary, 0.34)
                                    : alpha(APP_COLORS.surface, 0.3)
                                }`,
                              }}
                            />
                          ) : null}
                        </Box>
                      ) : null}
                    </ListItemButton>
                  </Box>
                </Tooltip>

                {hasChildren && isMenuExpanded ? (
                  <Collapse in={isConfigMenuOpen} timeout="auto" unmountOnExit>
                    <List
                      disablePadding
                      sx={{
                        mt: 0.6,
                        ml: 2.6,
                        pl: 1,
                        borderLeft: `1px solid ${alpha(APP_COLORS.surface, isDarkMode ? 0.22 : 0.28)}`,
                      }}
                    >
                      {visibleChildren.map((child) => {
                        const isChildActive = pathname === child.href;

                        return (
                          <ListItemButton
                            key={child.label}
                            component={child.enabled ? Link : "button"}
                            href={child.enabled ? child.href : undefined}
                            disabled={!child.enabled}
                            onClick={() => {
                              if (!isDesktop) {
                                setMobileDrawerOpen(false);
                              }
                            }}
                            sx={{
                              mt: 0.35,
                              borderRadius: 1.75,
                              minHeight: 38,
                              border: `1px solid ${
                                isChildActive
                                  ? isDarkMode
                                    ? alpha(APP_COLORS.primary, 0.34)
                                    : alpha(APP_COLORS.surface, 0.42)
                                  : alpha(APP_COLORS.surface, 0.16)
                              }`,
                              color: menuText,
                              backgroundColor: isChildActive
                                ? isDarkMode
                                  ? alpha(APP_COLORS.primary, 0.18)
                                  : alpha(APP_COLORS.surface, 0.2)
                                : alpha(APP_COLORS.surface, 0.06),
                              "&:hover": {
                                backgroundColor: isDarkMode
                                  ? alpha(APP_COLORS.primary, 0.14)
                                  : alpha(APP_COLORS.surface, 0.14),
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 30,
                                color: isChildActive
                                  ? menuText
                                  : alpha(menuText, 0.88),
                              }}
                            >
                              {child.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={child.label}
                              primaryTypographyProps={{
                                sx: {
                                  fontSize: 13,
                                  fontWeight: isChildActive ? 700 : 500,
                                },
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                ) : null}
              </Box>
            );
          })}
      </List>

      <Box sx={{ mt: "auto", pt: 2, position: "relative", zIndex: 1 }}>
        <Divider
          sx={{
            borderColor: isDarkMode
              ? alpha(APP_COLORS.primary, 0.24)
              : alpha(APP_COLORS.surface, 0.24),
          }}
        />
        {isMenuExpanded ? (
          <Typography
            variant="caption"
            sx={{
              mt: 1.5,
              display: "block",
              color: menuMutedText,
            }}
          >
            v2026.03.10
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  if (!isSessionReady) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "background.default",
          px: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 4,
            border: `1px solid ${alpha(APP_COLORS.primary, 0.35)}`,
            boxShadow: "0 14px 34px rgba(23, 39, 11, 0.1)",
            p: 4,
            textAlign: "center",
            backgroundColor: "background.paper",
          }}
        >
          <CircularProgress
            size={28}
            thickness={5}
            sx={{ color: "primary.main", mb: 2 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Preparando tu sesion
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            Cargando permisos y configuracion de Gestion Humana...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!user || !userId) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "background.default",
          px: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 4,
            border: `1px solid ${alpha(APP_COLORS.primary, 0.28)}`,
            p: 3,
            textAlign: "center",
            backgroundColor: "background.paper",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "text.primary", fontWeight: 600 }}
          >
            Verificando acceso...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: "background.default",
        overflow: "hidden",
      }}
    >
      <CssBaseline />

      <AppBar
        elevation={0}
        sx={{
          ml: { lg: `${activeDrawerWidth}px` },
          width: { lg: `calc(100% - ${activeDrawerWidth}px)` },
          backgroundColor: shellBg,
          borderBottom: `1px solid ${
            isDarkMode
              ? alpha(APP_COLORS.primary, 0.22)
              : alpha(APP_COLORS.surface, 0.2)
          }`,
          color: shellText,
          boxShadow: `0 3px 18px ${alpha(APP_COLORS.secondary, 0.12)}`,
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          {!isDesktop ? (
            <IconButton
              aria-label="Abrir menu"
              onClick={() => setMobileDrawerOpen(true)}
              edge="start"
              sx={{ mr: 1, color: shellText }}
            >
              <MenuRoundedIcon />
            </IconButton>
          ) : (
            <IconButton
              aria-label={isMenuExpanded ? "Comprimir menu" : "Expandir menu"}
              onClick={() => setIsMenuExpanded((prev) => !prev)}
              edge="start"
              sx={{ mr: 1, color: shellText }}
            >
              {isMenuExpanded ? <MenuOpenRoundedIcon /> : <MenuRoundedIcon />}
            </IconButton>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Centro de Gestion Humana
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <ThemeModeSwitcher />
            <Avatar
              sx={{
                bgcolor: isDarkMode
                  ? alpha(APP_COLORS.primary, 0.22)
                  : alpha(APP_COLORS.surface, 0.2),
                color: shellText,
                fontWeight: 800,
                border: `1px solid ${
                  isDarkMode
                    ? alpha(APP_COLORS.primary, 0.36)
                    : alpha(APP_COLORS.surface, 0.34)
                }`,
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: shellText,
                }}
              >
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: shellMutedText }}>
                Colaborador #{userId}
              </Typography>
            </Box>
            <IconButton
              aria-label="Cerrar sesion"
              onClick={handleLogout}
              sx={{ color: shellText }}
            >
              <LogoutRoundedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop ? true : mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: activeDrawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: activeDrawerWidth,
            borderRight: "none",
            backgroundColor: shellBg,
            boxSizing: "border-box",
          },
        }}
      >
        {menu}
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: { lg: `${activeDrawerWidth}px` },
          mt: "72px",
          minHeight: "calc(100dvh - 72px)",
          p: { xs: 2, md: 3 },
          boxSizing: "border-box",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Box
          key={pathname}
          sx={{
            animation: "routeFadeIn 220ms ease-out",
            "@keyframes routeFadeIn": {
              from: {
                opacity: 0,
                transform: "translateY(6px)",
              },
              to: {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
