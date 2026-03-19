import axios from "axios";

type BackendErrorPayload = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  timestamp?: string;
  path?: string;
};

export const getHttpErrorMessage = (
  error: unknown,
  fallbackMessage = "Ha ocurrido un error inesperado.",
) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as BackendErrorPayload | undefined;

    if (Array.isArray(payload?.message) && payload.message.length > 0) {
      return payload.message.join(", ");
    }

    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};
