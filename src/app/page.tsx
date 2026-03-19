"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import * as CryptoJS from "crypto-js";
import { authService } from "@/services";
import { useNotification } from "@/hooks";
import { useAuthStore } from "@/stores/auth.store";
import { APP_COLORS } from "@/theme/tokens";
import { getHttpErrorMessage } from "@/utils/http-error";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type LoginForm = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const router = useRouter();
  const { error: notifyError } = useNotification();
  const { setSession } = useAuthStore();
  const isDev = process.env.NODE_ENV === "development";
  const cryptoKey =
    process.env.NEXT_PUBLIC_AUTH_CREDENTIALS_CRYPTO_KEY ||
    (isDev ? "dev_crypto_key_change_me" : "");

  const [form, setForm] = useState<LoginForm>({
    email: isDev ? "ggarcia@hadamexico.com" : "",
    password: isDev ? "12345678" : "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cryptoKey) {
      setErrorMessage(
        "No hay clave de cifrado configurada para autenticacion.",
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const encryptedEmail = CryptoJS.AES.encrypt(
        form.email,
        cryptoKey,
      ).toString();
      const encryptedPassword = CryptoJS.AES.encrypt(
        form.password,
        cryptoKey,
      ).toString();

      const response = await authService.login({
        email: encryptedEmail,
        password: encryptedPassword,
      });

      if (response.status < 200 || response.status >= 300) {
        const message = "Credenciales invalidas o sesion no autorizada.";
        setErrorMessage(message);
        notifyError(message);
        return;
      }

      const sessionResponse = await authService.checkToken();
      setSession({
        userId: sessionResponse.data.userId,
        user: sessionResponse.data.user,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = getHttpErrorMessage(
        err,
        "No fue posible iniciar sesion. Intenta de nuevo.",
      );
      setErrorMessage(message);
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="main"
      data-mui-color-scheme="light"
      sx={{
        colorScheme: "light",
        color: APP_COLORS.secondary,
        backgroundColor: APP_COLORS.surface,
      }}
    >
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          px: 2,
          py: 4,
          "@keyframes cardRise": {
            from: {
              opacity: 0,
              transform: "translateY(18px)",
            },
            to: {
              opacity: 1,
              transform: "translateY(0)",
            },
          },
          "@keyframes pulseFloat": {
            "0%": {
              transform: "translateY(0)",
            },
            "50%": {
              transform: "translateY(-4px)",
            },
            "100%": {
              transform: "translateY(0)",
            },
          },
          background: `linear-gradient(160deg, ${alpha(APP_COLORS.surface, 0.94)} 0%, ${alpha(APP_COLORS.primary, 0.08)} 100%)`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 980,
            overflow: "hidden",
            borderRadius: 6,
            border: `1px solid ${alpha(APP_COLORS.primary, 0.28)}`,
            boxShadow: "0 18px 48px rgba(10, 46, 28, 0.14)",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1.1fr 1fr",
            },
            animation: "cardRise 520ms ease-out",
          }}
        >
          <Box
            sx={{
              position: "relative",
              bgcolor: "primary.main",
              color: APP_COLORS.surface,
              p: { xs: 4, md: 6 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 4,
              isolation: "isolate",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(140deg, ${alpha(APP_COLORS.surface, 0.18)} 0%, ${alpha(APP_COLORS.primary, 0.06)} 60%, transparent 100%)`,
                zIndex: -1,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: -46,
                bottom: -46,
                width: 188,
                height: 188,
                borderRadius: "50%",
                border: `1px dashed ${alpha(APP_COLORS.surface, 0.35)}`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 54,
                top: 42,
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: alpha(APP_COLORS.surface, 0.1),
                transform: "rotate(15deg)",
              }}
            />

            <Stack spacing={2}>
              <Box
                sx={{
                  width: "fit-content",
                  maxWidth: "100%",
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: alpha(APP_COLORS.surface, 0.78),
                  border: `1px solid ${alpha(APP_COLORS.surface, 0.92)}`,
                  backdropFilter: "blur(3px)",
                  boxShadow: "0 10px 26px rgba(35, 58, 15, 0.22)",
                  animation: "pulseFloat 4s ease-in-out infinite",
                }}
              >
                <Box
                  component="img"
                  src="https://api.comportarte.com/static/images/login/logo-superior.png"
                  alt="Logo principal"
                  sx={{
                    width: 220,
                    maxWidth: "100%",
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08))",
                  }}
                />
              </Box>

              <Typography variant="h4">Gestión Humana</Typography>
              <Typography variant="body1" sx={{ maxWidth: 360 }}>
                Administra procesos, personal y seguimiento en una sola
                plataforma.
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 360 }}>
                Optimiza tu gestión humana con herramientas integrales y fáciles
                de usar.
              </Typography>
            </Stack>

            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Plataforma integral de gestion humana inteligente.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 4, md: 6 },
              bgcolor: APP_COLORS.surface,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 3,
              animation: "cardRise 520ms ease-out 120ms both",
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h5" sx={{ color: APP_COLORS.secondary }}>
                Iniciar sesion
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha(APP_COLORS.secondary, 0.82) }}
              >
                Ingresa con tu correo corporativo y contraseña.
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <TextField
                label="Correo"
                type="email"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                required
                fullWidth
                autoComplete="email"
                InputProps={{
                  sx: {
                    bgcolor: APP_COLORS.surface,
                    "& .MuiInputBase-input": {
                      color: APP_COLORS.secondary,
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon
                        fontSize="small"
                        sx={{ color: alpha(APP_COLORS.secondary, 0.7) }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: alpha(APP_COLORS.secondary, 0.75),
                  },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: alpha(APP_COLORS.secondary, 0.24),
                    },
                    "&:hover fieldset": {
                      borderColor: alpha(APP_COLORS.secondary, 0.38),
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: APP_COLORS.primary,
                    },
                  },
                }}
              />

              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  handleChange("password", event.target.value)
                }
                required
                fullWidth
                autoComplete="current-password"
                InputProps={{
                  sx: {
                    bgcolor: APP_COLORS.surface,
                    "& .MuiInputBase-input": {
                      color: APP_COLORS.secondary,
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon
                        fontSize="small"
                        sx={{ color: alpha(APP_COLORS.secondary, 0.7) }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Mostrar u ocultar contrasena"
                        onClick={() => setShowPassword((state) => !state)}
                        edge="end"
                        sx={{ color: alpha(APP_COLORS.secondary, 0.68) }}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: alpha(APP_COLORS.secondary, 0.75),
                  },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: alpha(APP_COLORS.secondary, 0.24),
                    },
                    "&:hover fieldset": {
                      borderColor: alpha(APP_COLORS.secondary, 0.38),
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: APP_COLORS.primary,
                    },
                  },
                }}
              />
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberUser}
                  onChange={(event) => setRememberUser(event.target.checked)}
                  color="primary"
                />
              }
              label="Recordarme en este equipo"
              sx={{ mt: -1, color: alpha(APP_COLORS.secondary, 0.9) }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                py: 1.4,
                fontWeight: 700,
                letterSpacing: 0.2,
                textTransform: "none",
                borderRadius: 3,
                boxShadow: "none",
                minHeight: 48,
                bgcolor: APP_COLORS.primary,
                color: APP_COLORS.surface,
                border: `1px solid ${alpha(APP_COLORS.secondary, 0.08)}`,
                "&:hover": {
                  boxShadow: "none",
                  bgcolor: alpha(APP_COLORS.primary, 0.92),
                },
                "&:disabled": {
                  color: alpha(APP_COLORS.surface, 0.82),
                  bgcolor: alpha(APP_COLORS.primary, 0.65),
                  borderColor: "transparent",
                },
              }}
            >
              {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
            </Button>

            {errorMessage ? (
              <Typography
                variant="body2"
                sx={{ color: APP_COLORS.secondary, mt: -1 }}
              >
                {errorMessage}
              </Typography>
            ) : null}

            <Divider sx={{ borderColor: alpha(APP_COLORS.primary, 0.2) }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ width: "100%" }}
            >
              <Link
                href="#"
                underline="hover"
                color="primary.dark"
                sx={{
                  fontWeight: 600,
                  flex: 1,
                  textAlign: { xs: "left", sm: "center" },
                }}
              >
                Registrarse
              </Link>

              <Link
                href="#"
                underline="hover"
                color="primary.dark"
                sx={{
                  fontWeight: 600,
                  flex: 1,
                  textAlign: { xs: "left", sm: "center" },
                }}
              >
                ¿ Olvidaste tu contraseña ?
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginPage;
