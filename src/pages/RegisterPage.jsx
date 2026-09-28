import { useState } from "react";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import PageContainer from "../components/layout/PageContainer";

import AuthCard from "../components/forms/AuthCard";
import AuthTitle from "../components/forms/AuthTitle";
import AuthSubtitle from "../components/forms/AuthSubtitle";
import TextInput from "../components/forms/TextInput";
import PrimaryButton from "../components/forms/PrimaryButton";

import MessageAlert from "../components/common/MessageAlert";

import { register } from "../services/authService";

import { Link as RouterLink } from "react-router-dom";

import { isValidPassword } from "../utils/passwordValidation";
import { initializeNewUser } from "../utils/initialSetup";

function RegisterPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    setSuccess("");

    // Email obligatorio
    if (!email.trim()) {
      setError("Introduce un correo electrónico.");
      return;
    }

    // Contraseña obligatoria
    if (!password) {
      setError("Introduce una contraseña.");
      return;
    }

    // Confirmación obligatoria
    if (!confirmPassword) {
      setError("Confirma tu contraseña.");
      return;
    }

    // Las contraseñas deben coincidir
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Validación de contraseña: Longitud mínima más Patrón de seguridad
    if (!isValidPassword(password)) {
      setError(
        "La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número."
      );
      return;
    }

    try {
      setLoading(true);

      const userCredential = await register(
        email,
        password
      );

      await initializeNewUser(
        userCredential.user
      );

      setSuccess("Cuenta creada correctamente.");

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {

      if (error.code === "auth/email-already-in-use") {
        setError("Ese correo electrónico ya está registrado.");
        return;
      }

      setError("Ha ocurrido un error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <AuthCard>

        <AuthTitle>
          Crear cuenta
        </AuthTitle>

        <AuthSubtitle>
          Crea tu cuenta para empezar a gestionar tu hogar.
        </AuthSubtitle>

        <form onSubmit={handleSubmit}>

          <TextInput
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <TextInput
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <TextInput
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />

          <PrimaryButton
            type="submit"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </PrimaryButton>

          {error && (
            <MessageAlert>
              {error}
            </MessageAlert>
          )}

          {success && (
            <MessageAlert severity="success">
              {success}
            </MessageAlert>
          )}

        </form>

        <Typography
          align="center"
          sx={{ mt: 3 }}
        >
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            color="primary"
            fontWeight={500}
          >
            ¿Ya tienes cuenta?
          </Link>
        </Typography>

      </AuthCard>
    </PageContainer>
  );
}

export default RegisterPage;