import {
    useEffect,
    useState,
} from "react";

import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Typography,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import LogoutIcon from "@mui/icons-material/Logout";

import ConfirmDialog from "../common/ConfirmDialog";

import useHome from "../../hooks/useHome";

import {
    getAcceptedHomeInvitations,
    normalizeEmail,
} from "../../services/invitationService";

import {
    getHomeById,
    removeHomeMember,
    leaveSharedHome,
} from "../../services/homeService";

import {
    getUserProfile,
} from "../../services/userProfileService";


function HomeMembersCard({
    home,
    user,
}) {

    const {
        setHome,
    } = useHome();


    const [
        acceptedInvitations,
        setAcceptedInvitations,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState("");


    /*
     * RETIRAR MIEMBRO
     */

    const [
        selectedMember,
        setSelectedMember,
    ] = useState(null);


    const [
        removeDialogOpen,
        setRemoveDialogOpen,
    ] = useState(false);


    const [
        removingMember,
        setRemovingMember,
    ] = useState(false);


    /*
     * ABANDONAR HOGAR
     */

    const [
        leaveDialogOpen,
        setLeaveDialogOpen,
    ] = useState(false);


    const [
        leavingHome,
        setLeavingHome,
    ] = useState(false);


    const isOwner =
        Boolean(
            user
            && home
            && home.ownerId ===
            user.uid
        );


    useEffect(() => {

        let cancelled =
            false;


        async function loadMembers() {

            if (
                !home
                || !user
            ) {

                if (!cancelled) {

                    setAcceptedInvitations([]);

                    setLoading(false);

                }

                return;

            }


            try {

                if (!cancelled) {

                    setLoading(true);

                    setError("");

                }


                const data =
                    await getAcceptedHomeInvitations(
                        home.id
                    );


                if (!cancelled) {

                    setAcceptedInvitations(
                        data
                    );

                }

            } catch (error) {

                console.error(
                    "Error al cargar los miembros del hogar:",
                    error
                );


                if (!cancelled) {

                    setError(
                        "No se han podido cargar los miembros del hogar."
                    );

                }

            } finally {

                if (!cancelled) {

                    setLoading(false);

                }

            }

        }


        loadMembers();


        return () => {

            cancelled =
                true;

        };

    }, [
        home,
        user,
    ]);


    function getInitial(
        email
    ) {

        const normalizedEmail =
            normalizeEmail(
                email
            );


        if (!normalizedEmail) {
            return "?";
        }


        return normalizedEmail
            .charAt(0)
            .toUpperCase();

    }


    /*
     * RETIRAR MIEMBRO
     */

    function handleRequestRemove(
        member
    ) {

        if (!isOwner) {
            return;
        }


        if (
            !member
            || member.role === "owner"
        ) {
            return;
        }


        if (
            member.id ===
            user.uid
        ) {
            return;
        }


        setError("");

        setSuccess("");

        setSelectedMember(
            member
        );

        setRemoveDialogOpen(
            true
        );

    }


    function handleCancelRemove() {

        if (removingMember) {
            return;
        }


        setRemoveDialogOpen(
            false
        );

        setSelectedMember(
            null
        );

    }


    async function handleConfirmRemove() {

        if (
            !home
            || !user
            || !isOwner
            || !selectedMember
            || selectedMember.role ===
            "owner"
            || selectedMember.id ===
            user.uid
        ) {
            return;
        }


        try {

            setRemovingMember(
                true
            );

            setError("");

            setSuccess("");


            await removeHomeMember(
                home.id,
                selectedMember.id
            );


            const updatedHome =
                await getHomeById(
                    home.id
                );


            if (!updatedHome) {

                throw new Error(
                    "No se ha podido actualizar el hogar."
                );

            }


            setHome(
                updatedHome
            );


            setSuccess(
                `${selectedMember.email || "El miembro"} ha sido retirado del hogar.`
            );


            setRemoveDialogOpen(
                false
            );

            setSelectedMember(
                null
            );

        } catch (error) {

            console.error(
                "Error al retirar el miembro del hogar:",
                error
            );


            setError(
                "No se ha podido retirar el miembro del hogar."
            );

        } finally {

            setRemovingMember(
                false
            );

        }

    }


    /*
     * ABANDONAR HOGAR
     */

    function handleRequestLeaveHome() {

        if (
            !home
            || !user
            || isOwner
        ) {
            return;
        }


        setError("");

        setSuccess("");

        setLeaveDialogOpen(
            true
        );

    }


    function handleCancelLeaveHome() {

        if (leavingHome) {
            return;
        }


        setLeaveDialogOpen(
            false
        );

    }


    async function handleConfirmLeaveHome() {

        if (
            !home
            || !user
            || isOwner
        ) {
            return;
        }


        try {

            setLeavingHome(
                true
            );

            setError("");

            setSuccess("");


            /*
             * Primero obtenemos el perfil.
             */

            const profile =
                await getUserProfile(
                    user.uid
                );


            if (
                !profile?.personalHomeId
            ) {

                throw new Error(
                    "No se ha encontrado el hogar personal del usuario."
                );

            }


            if (
                profile.personalHomeId ===
                home.id
            ) {

                throw new Error(
                    "No puedes abandonar tu hogar personal."
                );

            }


            /*
             * IMPORTANTE:
             *
             * Cargamos el hogar personal ANTES
             * de abandonar el compartido.
             */

            const personalHome =
                await getHomeById(
                    profile.personalHomeId
                );


            if (!personalHome) {

                throw new Error(
                    "No se ha podido cargar el hogar personal."
                );

            }


            /*
             * Operación atómica:
             *
             * - elimina UID de members
             * - activeHomeId = personalHomeId
             */

            await leaveSharedHome(
                home.id,
                user.uid,
                profile.personalHomeId
            );


            /*
             * Actualizamos inmediatamente
             * HomeContext.
             */

            setHome(
                personalHome
            );


            setLeaveDialogOpen(
                false
            );


            setSuccess(
                "Has abandonado el hogar compartido y has vuelto a tu hogar personal."
            );

        } catch (error) {

            console.error(
                "Error al abandonar el hogar:",
                error
            );


            setError(
                "No se ha podido abandonar el hogar."
            );

        } finally {

            setLeavingHome(
                false
            );

        }

    }


    /*
     * CONSTRUIR LISTA DE MIEMBROS
     */

    const ownerInvitation =
        acceptedInvitations.find(
            (invitation) =>
                invitation.ownerId ===
                home?.ownerId
        );


    const ownerEmail =
        home?.ownerId === user?.uid
            ? user?.email || ""
            : ownerInvitation?.ownerEmail || "";


    const memberRows = [];


    if (home?.ownerId) {

        memberRows.push({
            id:
                home.ownerId,

            email:
                ownerEmail,

            role:
                "owner",
        });

    }


    acceptedInvitations.forEach(
        (invitation) => {

            if (
                !invitation.acceptedBy
            ) {
                return;
            }


            if (
                invitation.acceptedBy ===
                home?.ownerId
            ) {
                return;
            }


            if (
                Array.isArray(
                    home?.members
                )
                && !home.members.includes(
                    invitation.acceptedBy
                )
            ) {
                return;
            }


            const alreadyExists =
                memberRows.some(
                    (member) =>
                        member.id ===
                        invitation.acceptedBy
                );


            if (alreadyExists) {
                return;
            }


            memberRows.push({
                id:
                    invitation.acceptedBy,

                email:
                    invitation.invitedEmail
                    || "",

                role:
                    "member",
            });

        }
    );


    const homeMembersCount =
        Array.isArray(
            home?.members
        )
            ? home.members.length
            : memberRows.length;


    return (

        <>

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

                        <PeopleIcon
                            color="primary"
                        />


                        <Box>

                            <Typography
                                variant="h6"
                                fontWeight="bold"
                            >
                                Miembros del hogar
                            </Typography>


                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {homeMembersCount}{" "}
                                {
                                    homeMembersCount === 1
                                        ? "miembro"
                                        : "miembros"
                                }
                            </Typography>

                        </Box>

                    </Box>


                    {success && (

                        <Typography
                            color="success.main"
                            sx={{
                                mb: 2,
                            }}
                        >
                            {success}
                        </Typography>

                    )}


                    {loading && (

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                py: 2,
                            }}
                        >

                            <CircularProgress
                                size={22}
                            />


                            <Typography
                                color="text.secondary"
                            >
                                Cargando miembros...
                            </Typography>

                        </Box>

                    )}


                    {!loading
                        && error
                        && (

                            <Typography
                                color="error"
                            >
                                {error}
                            </Typography>

                        )}


                    {!loading
                        && !error
                        && memberRows.length === 0
                        && (

                            <Typography
                                color="text.secondary"
                            >
                                No se han encontrado miembros.
                            </Typography>

                        )}


                    {!loading
                        && !error
                        && memberRows.map(
                            (
                                member,
                                index
                            ) => {

                                const isCurrentUser =
                                    member.id ===
                                    user?.uid;


                                const canRemove =
                                    isOwner
                                    && member.role ===
                                    "member"
                                    && !isCurrentUser;


                                return (

                                    <Box
                                        key={
                                            member.id
                                        }
                                    >

                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: {
                                                    xs: "flex-start",
                                                    sm: "center",
                                                },
                                                flexDirection: {
                                                    xs: "column",
                                                    sm: "row",
                                                },
                                                gap: 2,
                                                py: 1.5,
                                            }}
                                        >

                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 2,
                                                    flexGrow: 1,
                                                    minWidth: 0,
                                                    width: {
                                                        xs: "100%",
                                                        sm: "auto",
                                                    },
                                                }}
                                            >

                                                <Avatar
                                                    sx={{
                                                        bgcolor:
                                                            "primary.main",
                                                    }}
                                                >
                                                    {getInitial(
                                                        member.email
                                                    )}
                                                </Avatar>


                                                <Box
                                                    sx={{
                                                        flexGrow: 1,
                                                        minWidth: 0,
                                                    }}
                                                >

                                                    <Typography
                                                        fontWeight={500}
                                                        sx={{
                                                            overflow:
                                                                "hidden",

                                                            textOverflow:
                                                                "ellipsis",

                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {
                                                            member.email
                                                            || "Usuario del hogar"
                                                        }
                                                    </Typography>


                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {
                                                            member.role ===
                                                                "owner"
                                                                ? "Propietario"
                                                                : "Miembro"
                                                        }

                                                        {
                                                            isCurrentUser
                                                                ? " · Tú"
                                                                : ""
                                                        }
                                                    </Typography>

                                                </Box>

                                            </Box>


                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    flexWrap: "wrap",
                                                    ml: {
                                                        xs: 7,
                                                        sm: 0,
                                                    },
                                                }}
                                            >

                                                <Chip
                                                    label={
                                                        member.role ===
                                                            "owner"
                                                            ? "Propietario"
                                                            : "Miembro"
                                                    }

                                                    color={
                                                        member.role ===
                                                            "owner"
                                                            ? "primary"
                                                            : "default"
                                                    }

                                                    size="small"
                                                />


                                                {canRemove && (

                                                    <Button
                                                        color="error"
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={
                                                            <PersonRemoveIcon />
                                                        }
                                                        onClick={() =>
                                                            handleRequestRemove(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        Retirar
                                                    </Button>

                                                )}

                                            </Box>

                                        </Box>


                                        {
                                            index
                                            < memberRows.length - 1
                                            && (
                                                <Divider />
                                            )
                                        }

                                    </Box>

                                );

                            }
                        )}


                    {/*
                     * ABANDONAR HOGAR
                     *
                     * Solo visible para miembros.
                     */}

                    {!loading
                        && !error
                        && !isOwner
                        && (

                            <>

                                <Divider
                                    sx={{
                                        my: 2,
                                    }}
                                />


                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent:
                                            "flex-end",
                                    }}
                                >

                                    <Button
                                        color="error"
                                        variant="outlined"
                                        startIcon={
                                            <LogoutIcon />
                                        }
                                        onClick={
                                            handleRequestLeaveHome
                                        }
                                    >
                                        Abandonar hogar
                                    </Button>

                                </Box>

                            </>

                        )}

                </CardContent>

            </Card>


            {/*
             * DIÁLOGO RETIRAR MIEMBRO
             */}

            <ConfirmDialog
                open={
                    removeDialogOpen
                }

                title="Retirar miembro"

                message={
                    selectedMember
                        ? `¿Seguro que deseas retirar a "${selectedMember.email || "este miembro"}" del hogar? Dejará de tener acceso al inventario, historial y lista de la compra compartidos.`
                        : ""
                }

                confirmText="Retirar"

                loading={
                    removingMember
                }

                onCancel={
                    handleCancelRemove
                }

                onConfirm={
                    handleConfirmRemove
                }
            />


            {/*
             * DIÁLOGO ABANDONAR HOGAR
             */}

            <ConfirmDialog
                open={
                    leaveDialogOpen
                }

                title="Abandonar hogar"

                message={
                    home
                        ? `¿Seguro que deseas abandonar "${home.name || "este hogar"}"? Dejarás de tener acceso a sus productos, historial y lista de la compra, y volverás a tu hogar personal.`
                        : ""
                }

                confirmText="Abandonar"

                loading={
                    leavingHome
                }

                onCancel={
                    handleCancelLeaveHome
                }

                onConfirm={
                    handleConfirmLeaveHome
                }
            />

        </>

    );

}


export default HomeMembersCard;