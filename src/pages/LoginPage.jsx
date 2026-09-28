import { login } from "../services/authService";

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

import { Link as RouterLink, useNavigate } from "react-router-dom";

function LoginPage() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    // Correo obligatorio
    if (!email.trim()) {
      setError("Introduce un correo electrónico.");
      return;
    }

    // Contraseña obligatoria
    if (!password) {
      setError("Introduce una contraseña.");
      return;
    }

    try {
      await login(email, password);

      navigate("/");

      console.log("Sesión iniciada correctamente.");

    } catch (error) {

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      setError("Ha ocurrido un error al iniciar sesión.");
    }
  }

  return (
    <PageContainer>
      <AuthCard>

        <AuthTitle>
          Iniciar sesión
        </AuthTitle>

        <AuthSubtitle>
          Accede a tu cuenta para gestionar tu hogar.
        </AuthSubtitle>

        <form onSubmit={handleSubmit}>

          <TextInput
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextInput
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PrimaryButton type="submit">
            Iniciar sesión
          </PrimaryButton>

          {error && (
            <MessageAlert>
              {error}
            </MessageAlert>
          )}

        </form>

        <Typography
          align="center"
          sx={{ mt: 3 }}
        >
          <Link
            component={RouterLink}
            to="/register"
            underline="hover"
            color="primary"
            fontWeight={500}
          >
            ¿No tienes cuenta?
          </Link>
        </Typography>

      </AuthCard>
    </PageContainer>
  );
}

export default LoginPage;