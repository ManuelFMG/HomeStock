import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import BackToHomeButton from "../components/layout/BackToHomeButton";

import useAuth from "../hooks/useAuth";
import useHome from "../hooks/useHome";

import {
  createHomeInvitation,
  getOwnerInvitations,
  getPendingInvitationsByEmail,
  normalizeEmail,
  acceptHomeInvitation,
  rejectHomeInvitation,
} from "../services/invitationService";

import {
  getHomeById,
} from "../services/homeService";

import HomeMembersCard from "../components/settings/HomeMembersCard";


function SettingsPage() {

  const { user } =
    useAuth();


  const {
    home,
    setHome,
  } = useHome();


  const [
    invitedEmail,
    setInvitedEmail,
  ] = useState("");


  const [
    invitations,
    setInvitations,
  ] = useState([]);


  const [
    receivedInvitations,
    setReceivedInvitations,
  ] = useState([]);


  const [
    loadingInvitations,
    setLoadingInvitations,
  ] = useState(true);


  const [
    loadingReceivedInvitations,
    setLoadingReceivedInvitations,
  ] = useState(true);


  const [
    sendingInvitation,
    setSendingInvitation,
  ] = useState(false);


  const [
    respondingInvitationId,
    setRespondingInvitationId,
  ] = useState(null);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  const isOwner =
    Boolean(
      user
      && home
      && home.ownerId === user.uid
    );


  const loadOwnerInvitations = useCallback(async () => {

    if (
      !user
      || !home
      || !isOwner
    ) {

      setInvitations([]);

      setLoadingInvitations(
        false
      );

      return;

    }


    try {

      setLoadingInvitations(
        true
      );


      const data =
        await getOwnerInvitations(
          user.uid
        );


      setInvitations(
        data
      );

    } catch (error) {

      console.error(
        "Error al cargar las invitaciones creadas:",
        error
      );


      setError(
        "No se han podido cargar las invitaciones."
      );

    } finally {

      setLoadingInvitations(
        false
      );

    }

  }, [user, home, isOwner]);


  const loadReceivedInvitations = useCallback(async () => {

    if (
      !user
      || !user.email
    ) {

      setReceivedInvitations([]);

      setLoadingReceivedInvitations(
        false
      );

      return;

    }


    try {

      setLoadingReceivedInvitations(
        true
      );


      const data =
        await getPendingInvitationsByEmail(
          user.email
        );


      setReceivedInvitations(
        data
      );

    } catch (error) {

      console.error(
        "Error al cargar las invitaciones recibidas:",
        error
      );


      setError(
        "No se han podido cargar las invitaciones recibidas."
      );

    } finally {

      setLoadingReceivedInvitations(
        false
      );

    }

  }, [user]);


  useEffect(() => {

    loadOwnerInvitations();

  }, [loadOwnerInvitations]);


  useEffect(() => {

    loadReceivedInvitations();

  }, [loadReceivedInvitations]);


  async function handleInvite(
    event
  ) {

    event.preventDefault();


    if (
      !user
      || !home
      || !isOwner
    ) {
      return;
    }


    const normalizedInvitedEmail =
      normalizeEmail(
        invitedEmail
      );


    const normalizedCurrentEmail =
      normalizeEmail(
        user.email
      );


    setError("");

    setSuccess("");


    if (!normalizedInvitedEmail) {

      setError(
        "Introduce un correo electrónico."
      );

      return;

    }


    if (
      normalizedInvitedEmail ===
      normalizedCurrentEmail
    ) {

      setError(
        "No puedes invitar tu propia cuenta."
      );

      return;

    }


    try {

      setSendingInvitation(
        true
      );


      const result =
        await createHomeInvitation({
          homeId:
            home.id,

          homeName:
            home.name,

          ownerId:
            user.uid,

          ownerEmail:
            user.email,

          invitedEmail:
            normalizedInvitedEmail,
        });


      if (result.duplicate) {

        setError(
          `"${normalizedInvitedEmail}" ya tiene una invitación pendiente.`
        );

        return;

      }


      setSuccess(
        `Invitación creada para ${normalizedInvitedEmail}.`
      );


      setInvitedEmail("");


      await loadOwnerInvitations();

    } catch (error) {

      console.error(
        "Error al crear la invitación:",
        error
      );


      setError(
        "No se ha podido crear la invitación."
      );

    } finally {

      setSendingInvitation(
        false
      );

    }

  }


  async function handleAcceptInvitation(
    invitation
  ) {

    if (
      !user
      || respondingInvitationId
    ) {
      return;
    }


    try {

      setRespondingInvitationId(
        invitation.id
      );

      setError("");

      setSuccess("");


      await acceptHomeInvitation(
        invitation,
        user
      );


      /*
       * Actualizamos HomeContext inmediatamente.
       *
       * En el siguiente paso comprobaremos
       * también la carga automática completa
       * como miembro al iniciar sesión.
       */
      const sharedHome =
        await getHomeById(
          invitation.homeId
        );


      if (!sharedHome) {

        throw new Error(
          "No se ha podido cargar el hogar compartido."
        );

      }


      setHome(
        sharedHome
      );


      setReceivedInvitations(
        (currentInvitations) =>
          currentInvitations.filter(
            (currentInvitation) =>
              currentInvitation.id !==
              invitation.id
          )
      );


      setSuccess(
        `Te has unido correctamente a "${invitation.homeName}".`
      );

    } catch (error) {

      console.error(
        "Error al aceptar la invitación:",
        error
      );


      setError(
        "No se ha podido aceptar la invitación."
      );

    } finally {

      setRespondingInvitationId(
        null
      );

    }

  }


  async function handleRejectInvitation(
    invitation
  ) {

    if (
      !user
      || respondingInvitationId
    ) {
      return;
    }


    try {

      setRespondingInvitationId(
        invitation.id
      );

      setError("");

      setSuccess("");


      await rejectHomeInvitation(
        invitation,
        user
      );


      setReceivedInvitations(
        (currentInvitations) =>
          currentInvitations.filter(
            (currentInvitation) =>
              currentInvitation.id !==
              invitation.id
          )
      );


      setSuccess(
        `Has rechazado la invitación a "${invitation.homeName}".`
      );

    } catch (error) {

      console.error(
        "Error al rechazar la invitación:",
        error
      );


      setError(
        "No se ha podido rechazar la invitación."
      );

    } finally {

      setRespondingInvitationId(
        null
      );

    }

  }


  const pendingInvitations =
    invitations.filter(
      (invitation) =>
        invitation.status ===
        "pending"
    );


  return (

    <Box>

      <BackToHomeButton />


      <Typography
        variant="h4"
        fontWeight={700}
        sx={{
          mb: 1,
        }}
      >
        Ajustes
      </Typography>


      <Typography
        color="text.secondary"
        sx={{
          mb: 4,
        }}
      >
        Configura tu hogar y tu cuenta de HomeStock.
      </Typography>


      {/* MENSAJES */}

      {error && (

        <Typography
          color="error"
          sx={{
            mb: 3,
          }}
        >
          {error}
        </Typography>

      )}


      {success && (

        <Typography
          color="success.main"
          sx={{
            mb: 3,
          }}
        >
          {success}
        </Typography>

      )}


      {/* INVITACIONES RECIBIDAS */}

      <Card
        sx={{
          borderRadius: 3,
          mb: 3,
        }}
      >

        <CardContent>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >

            <MarkEmailUnreadIcon
              color="primary"
            />

            <Typography
              variant="h6"
              fontWeight="bold"
            >
              Invitaciones recibidas
            </Typography>

          </Box>


          {loadingReceivedInvitations && (

            <Typography
              color="text.secondary"
            >
              Cargando invitaciones...
            </Typography>

          )}


          {!loadingReceivedInvitations
            && receivedInvitations.length === 0
            && (

              <Typography
                color="text.secondary"
              >
                No tienes invitaciones pendientes.
              </Typography>

            )}


          {!loadingReceivedInvitations
            && receivedInvitations.map(
              (
                invitation,
                index
              ) => {

                const responding =
                  respondingInvitationId ===
                  invitation.id;


                return (

                  <Box
                    key={
                      invitation.id
                    }
                  >

                    <Box
                      sx={{
                        py: 2,
                      }}
                    >

                      <Typography
                        fontWeight="bold"
                      >
                        {
                          invitation.homeName
                        }
                      </Typography>


                      <Typography
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {
                          invitation.ownerEmail
                        }{" "}
                        te ha invitado a compartir este hogar.
                      </Typography>


                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          mt: 2,
                          flexWrap: "wrap",
                        }}
                      >

                        <Button
                          variant="contained"

                          startIcon={
                            <CheckIcon />
                          }

                          disabled={
                            responding
                          }

                          onClick={() =>
                            handleAcceptInvitation(
                              invitation
                            )
                          }
                        >
                          {responding
                            ? "Procesando..."
                            : "Aceptar"}
                        </Button>


                        <Button
                          color="error"
                          variant="outlined"

                          startIcon={
                            <CloseIcon />
                          }

                          disabled={
                            responding
                          }

                          onClick={() =>
                            handleRejectInvitation(
                              invitation
                            )
                          }
                        >
                          Rechazar
                        </Button>

                      </Box>

                    </Box>


                    {
                      index
                      < receivedInvitations.length - 1
                      && (
                        <Divider />
                      )
                    }

                  </Box>

                );

              }
            )}

        </CardContent>

      </Card>


      {/* INFORMACIÓN DEL HOGAR */}

      {home && (

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
          }}
        >

          <CardContent>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >

              <HomeIcon
                color="primary"
              />

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Mi hogar
              </Typography>

            </Box>


            <Typography
              fontWeight="bold"
            >
              {home.name || "Mi Hogar"}
            </Typography>


            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              {isOwner
                ? "Eres el propietario de este hogar."
                : "Eres miembro de este hogar."}
            </Typography>


            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              Miembros:{" "}
              {
                Array.isArray(
                  home.members
                )
                  ? home.members.length
                  : 1
              }
            </Typography>

          </CardContent>

        </Card>

      )}

      {home && user && (

        <HomeMembersCard
          home={home}
          user={user}
        />

      )}

      {/* COMPARTIR HOGAR */}

      {isOwner && (

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
          }}
        >

          <CardContent>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >

              <PersonAddIcon
                color="primary"
              />

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Compartir hogar
              </Typography>

            </Box>


            <Typography
              color="text.secondary"
              sx={{
                mb: 3,
              }}
            >
              Invita a otra persona para compartir tu HomeStock.
            </Typography>


            <Box
              component="form"
              onSubmit={
                handleInvite
              }

              sx={{
                display: "flex",

                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },

                flexDirection: {
                  xs: "column",
                  sm: "row",
                },

                gap: 2,
              }}
            >

              <TextField
                label="Correo electrónico"
                type="email"

                value={
                  invitedEmail
                }

                onChange={
                  (event) =>
                    setInvitedEmail(
                      event.target.value
                    )
                }

                disabled={
                  sendingInvitation
                }

                fullWidth
              />


              <Button
                type="submit"
                variant="contained"

                startIcon={
                  <PersonAddIcon />
                }

                disabled={
                  sendingInvitation
                }

                sx={{
                  whiteSpace:
                    "nowrap",

                  minHeight:
                    56,
                }}
              >
                {sendingInvitation
                  ? "Enviando..."
                  : "Enviar invitación"}
              </Button>

            </Box>

          </CardContent>

        </Card>

      )}


      {/* INVITACIONES DEL PROPIETARIO */}

      {isOwner && (

        <Card
          sx={{
            borderRadius: 3,
          }}
        >

          <CardContent>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >

              <PeopleIcon
                color="primary"
              />

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Invitaciones pendientes
              </Typography>

            </Box>


            {loadingInvitations && (

              <Typography
                color="text.secondary"
              >
                Cargando invitaciones...
              </Typography>

            )}


            {!loadingInvitations
              && pendingInvitations.length === 0
              && (

                <Typography
                  color="text.secondary"
                >
                  No tienes invitaciones pendientes.
                </Typography>

              )}


            {!loadingInvitations
              && pendingInvitations.map(
                (
                  invitation,
                  index
                ) => (

                  <Box
                    key={
                      invitation.id
                    }
                  >

                    <Box
                      sx={{
                        py: 1.5,
                      }}
                    >

                      <Typography
                        fontWeight={500}
                      >
                        {
                          invitation.invitedEmail
                        }
                      </Typography>


                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Pendiente de aceptación
                      </Typography>

                    </Box>


                    {
                      index
                      < pendingInvitations.length - 1
                      && (
                        <Divider />
                      )
                    }

                  </Box>

                )
              )}

          </CardContent>

        </Card>

      )}

    </Box>

  );

}


export default SettingsPage;