"use client";

import {
  Alert,
  AlertColor,
  Snackbar,
  type SnackbarCloseReason,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NotifyOptions = {
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
};

type NotificationState = {
  open: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration: number;
};

type NotificationContextValue = {
  notify: (options: NotifyOptions) => void;
  success: (message: string, autoHideDuration?: number) => void;
  error: (message: string, autoHideDuration?: number) => void;
  warning: (message: string, autoHideDuration?: number) => void;
  info: (message: string, autoHideDuration?: number) => void;
};

const DEFAULT_AUTO_HIDE = 3500;

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
    autoHideDuration: DEFAULT_AUTO_HIDE,
  });

  const notify = useCallback((options: NotifyOptions) => {
    setNotification({
      open: true,
      message: options.message,
      severity: options.severity ?? "info",
      autoHideDuration: options.autoHideDuration ?? DEFAULT_AUTO_HIDE,
    });
  }, []);

  const closeNotification = useCallback(
    (_event?: Event | React.SyntheticEvent, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }

      setNotification((current) => ({ ...current, open: false }));
    },
    [],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      success: (message, autoHideDuration) =>
        notify({ message, severity: "success", autoHideDuration }),
      error: (message, autoHideDuration) =>
        notify({ message, severity: "error", autoHideDuration }),
      warning: (message, autoHideDuration) =>
        notify({ message, severity: "warning", autoHideDuration }),
      info: (message, autoHideDuration) =>
        notify({ message, severity: "info", autoHideDuration }),
    }),
    [notify],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }

  return context;
};
