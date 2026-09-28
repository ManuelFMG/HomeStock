import {
    useRef,
} from "react";

import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Divider,
    Fab,
    FormControlLabel,
    IconButton,
    Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";


function ShoppingList({
    items,
    loading,
    updatingQuantityId,
    updatingAllPurchased,
    updatingSectionStorage,
    addingToInventoryId,
    addingSectionStorage,
    onTogglePurchased,
    onToggleAllPurchased,
    onToggleSectionPurchased,
    onQuantityChange,
    onAddToInventory,
    onAddSectionToInventory,
    onRequestDeleteSection,
    onDelete,
}) {

    const sectionRefs =
        useRef({});


    const sections = [
        {
            storage: "Nevera",
            title: "Refrigerado",
            icon: "🧊",
        },
        {
            storage: "Congelador",
            title: "Congelado",
            icon: "❄️",
        },
        {
            storage: "Despensa",
            title: "Seco",
            icon: "🥫",
        },
        {
            storage: "Mueble de limpieza",
            title: "Droguería",
            icon: "🧹",
        },
    ];


    const knownStorages =
        sections.map(
            (section) =>
                section.storage
        );


    const selectedItemsCount =
        items.filter(
            (item) =>
                Boolean(
                    item.purchased
                )
        ).length;


    const allItemsSelected =
        items.length > 0
        && selectedItemsCount ===
        items.length;


    const someItemsSelected =
        selectedItemsCount > 0
        && !allItemsSelected;


    function getItemsByStorage(storage) {

        return items.filter(
            (item) =>
                item.storage === storage
        );

    }


    function getSectionUnits(
        sectionItems
    ) {

        return sectionItems.reduce(
            (total, item) => {

                const quantity =
                    Number(item.quantity) || 0;


                return (
                    total + quantity
                );

            },
            0
        );

    }


    function scrollToSection(storage) {

        const section =
            sectionRefs.current[
            storage
            ];


        if (!section) {
            return;
        }


        section.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

    }


    function scrollToTop() {

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

    }


    function renderSection({
        key,
        storage,
        title,
        icon,
        sectionItems,
        allowInventoryActions = true,
    }) {

        const sectionUnits =
            getSectionUnits(
                sectionItems
            );


        const markedItems =
            sectionItems.filter(
                (item) =>
                    Boolean(
                        item.purchased
                    )
            );


        const markedItemsCount =
            markedItems.length;


        const allSectionSelected =
            sectionItems.length > 0
            && markedItemsCount ===
            sectionItems.length;


        const someSectionSelected =
            markedItemsCount > 0
            && !allSectionSelected;


        const isUpdatingSection =
            updatingSectionStorage
            === storage;


        const isAddingSection =
            addingSectionStorage
            === storage;


        const sectionBusy =
            updatingAllPurchased
            || isUpdatingSection
            || isAddingSection;


        return (

            <Card
                key={key}

                ref={(element) => {

                    sectionRefs.current[
                        key
                    ] = element;

                }}

                sx={{
                    borderRadius: 3,
                    mb: 3,
                    scrollMarginTop: 24,
                }}
            >

                <CardContent>


                    {/* CABECERA DE SECCIÓN */}

                    <Box
                        sx={{
                            display: "flex",

                            justifyContent:
                                "space-between",

                            alignItems: {
                                xs: "flex-start",
                                md: "center",
                            },

                            flexDirection: {
                                xs: "column",
                                md: "row",
                            },

                            gap: 2,

                            mb: 1,
                        }}
                    >

                        <Box>

                            <Typography
                                variant="h6"
                                fontWeight="bold"
                            >
                                {icon} {title}
                            </Typography>


                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 0.5,
                                }}
                            >
                                {
                                    sectionItems.length
                                }{" "}
                                {
                                    sectionItems.length === 1
                                        ? "producto"
                                        : "productos"
                                }

                                {" · "}

                                {sectionUnits}{" "}
                                {
                                    sectionUnits === 1
                                        ? "unidad"
                                        : "unidades"
                                }

                                {" · "}

                                {markedItemsCount}{" "}
                                {
                                    markedItemsCount === 1
                                        ? "marcado"
                                        : "marcados"
                                }
                            </Typography>

                        </Box>


                        {
                            sectionItems.length > 0
                            && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >

                                    {allowInventoryActions && (

                                        <Button
                                            variant="contained"

                                            startIcon={
                                                <Inventory2Icon />
                                            }

                                            disabled={
                                                sectionBusy
                                                || Boolean(
                                                    addingToInventoryId
                                                )
                                                || markedItemsCount === 0
                                            }

                                            onClick={() =>
                                                onAddSectionToInventory({
                                                    storage,
                                                    title,
                                                    items:
                                                        sectionItems,
                                                })
                                            }
                                        >
                                            {isAddingSection
                                                ? "Añadiendo..."
                                                : "Añadir marcados al Inventario"}
                                        </Button>

                                    )}


                                    <Button
                                        color="error"
                                        variant="outlined"

                                        startIcon={
                                            <DeleteSweepIcon />
                                        }

                                        disabled={
                                            sectionBusy
                                        }

                                        onClick={() =>
                                            onRequestDeleteSection({
                                                storage,
                                                title,
                                                items:
                                                    sectionItems,
                                            })
                                        }
                                    >
                                        Eliminar lista
                                    </Button>

                                </Box>
                            )
                        }

                    </Box>


                    {/* MARCAR TODA LA SECCIÓN */}

                    {sectionItems.length > 0 && (

                        <Box
                            sx={{
                                mb: 1,
                            }}
                        >

                            <FormControlLabel
                                control={

                                    <Checkbox
                                        checked={
                                            allSectionSelected
                                        }

                                        indeterminate={
                                            someSectionSelected
                                        }

                                        disabled={
                                            updatingAllPurchased
                                            || Boolean(
                                                updatingSectionStorage
                                            )
                                            || isAddingSection
                                        }

                                        onChange={() =>
                                            onToggleSectionPurchased({
                                                storage,
                                                title,
                                                items:
                                                    sectionItems,
                                            })
                                        }
                                    />

                                }

                                label={
                                    allSectionSelected
                                        ? "Desmarcar todos"
                                        : "Marcar todos"
                                }
                            />

                        </Box>

                    )}


                    <Divider
                        sx={{
                            mb: 1,
                        }}
                    />


                    {/* PRODUCTOS */}

                    {sectionItems.length === 0 ? (

                        <Typography
                            color="text.secondary"
                            sx={{
                                py: 2,
                            }}
                        >
                            No hay productos en esta sección.
                        </Typography>

                    ) : (

                        sectionItems.map(
                            (item, index) => {

                                const quantity =
                                    Number(
                                        item.quantity
                                    ) || 1;


                                const isUpdatingQuantity =
                                    updatingQuantityId
                                    === item.id;


                                const isAddingToInventory =
                                    addingToInventoryId
                                    === item.id;


                                const itemBusy =
                                    isUpdatingQuantity
                                    || isAddingToInventory
                                    || sectionBusy;


                                const hasValidStorage =
                                    knownStorages.includes(
                                        item.storage
                                    );


                                return (

                                    <Box
                                        key={item.id}
                                    >

                                        <Box
                                            sx={{
                                                display: "flex",

                                                alignItems: {
                                                    xs: "flex-start",
                                                    md: "center",
                                                },

                                                flexDirection: {
                                                    xs: "column",
                                                    md: "row",
                                                },

                                                gap: 1.5,

                                                py: 1.5,
                                            }}
                                        >

                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    flexGrow: 1,

                                                    width: {
                                                        xs: "100%",
                                                        md: "auto",
                                                    },
                                                }}
                                            >

                                                <Checkbox
                                                    checked={
                                                        Boolean(
                                                            item.purchased
                                                        )
                                                    }

                                                    disabled={
                                                        itemBusy
                                                    }

                                                    onChange={() =>
                                                        onTogglePurchased(
                                                            item
                                                        )
                                                    }
                                                />


                                                <Box
                                                    sx={{
                                                        flexGrow: 1,
                                                    }}
                                                >

                                                    <Typography
                                                        fontWeight={500}

                                                        sx={{
                                                            textDecoration:
                                                                item.purchased
                                                                    ? "line-through"
                                                                    : "none",

                                                            color:
                                                                item.purchased
                                                                    ? "text.secondary"
                                                                    : "text.primary",
                                                        }}
                                                    >
                                                        {item.name}
                                                    </Typography>


                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 0.5,
                                                            mt: 0.5,
                                                        }}
                                                    >

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            Cantidad: {quantity}
                                                        </Typography>


                                                        <IconButton
                                                            size="small"

                                                            aria-label="Disminuir cantidad"

                                                            disabled={
                                                                itemBusy
                                                                || quantity <= 1
                                                            }

                                                            onClick={() =>
                                                                onQuantityChange(
                                                                    item,
                                                                    quantity - 1
                                                                )
                                                            }
                                                        >
                                                            <RemoveIcon
                                                                fontSize="small"
                                                            />
                                                        </IconButton>


                                                        <IconButton
                                                            size="small"

                                                            aria-label="Aumentar cantidad"

                                                            disabled={
                                                                itemBusy
                                                            }

                                                            onClick={() =>
                                                                onQuantityChange(
                                                                    item,
                                                                    quantity + 1
                                                                )
                                                            }
                                                        >
                                                            <AddIcon
                                                                fontSize="small"
                                                            />
                                                        </IconButton>

                                                    </Box>

                                                </Box>

                                            </Box>


                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    gap: 1,
                                                    flexWrap: "wrap",

                                                    width: {
                                                        xs: "100%",
                                                        md: "auto",
                                                    },

                                                    justifyContent: {
                                                        xs: "flex-end",
                                                        md: "flex-start",
                                                    },
                                                }}
                                            >

                                                <Button
                                                    variant="outlined"

                                                    startIcon={
                                                        <Inventory2Icon />
                                                    }

                                                    disabled={
                                                        itemBusy
                                                        || !hasValidStorage
                                                    }

                                                    onClick={() =>
                                                        onAddToInventory(
                                                            item
                                                        )
                                                    }
                                                >
                                                    {isAddingToInventory
                                                        ? "Añadiendo..."
                                                        : "Añadir a Inventario"}
                                                </Button>


                                                <Button
                                                    color="error"

                                                    disabled={
                                                        itemBusy
                                                    }

                                                    onClick={() =>
                                                        onDelete(
                                                            item
                                                        )
                                                    }

                                                    startIcon={
                                                        <DeleteIcon />
                                                    }
                                                >
                                                    Eliminar
                                                </Button>

                                            </Box>

                                        </Box>


                                        {
                                            index
                                            < sectionItems.length - 1
                                            && (
                                                <Divider />
                                            )
                                        }

                                    </Box>

                                );

                            }
                        )

                    )}

                </CardContent>

            </Card>

        );

    }


    const itemsWithoutValidStorage =
        items.filter(
            (item) =>
                !knownStorages.includes(
                    item.storage
                )
        );


    if (loading) {

        return (

            <Card
                sx={{
                    borderRadius: 3,
                }}
            >

                <CardContent>

                    <Typography
                        color="text.secondary"
                    >
                        Cargando lista de la compra...
                    </Typography>

                </CardContent>

            </Card>

        );

    }


    if (items.length === 0) {

        return (

            <Card
                sx={{
                    borderRadius: 3,
                }}
            >

                <CardContent>

                    <Typography
                        color="text.secondary"
                    >
                        No tienes productos en la lista de la compra.
                    </Typography>

                </CardContent>

            </Card>

        );

    }


    return (

        <Box>


            {/* CHECK GENERAL */}

            <Card
                sx={{
                    borderRadius: 3,
                    mb: 3,
                }}
            >

                <CardContent>

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                            mb: 1,
                        }}
                    >
                        Selección general
                    </Typography>


                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                        }}
                    >

                        <FormControlLabel
                            control={

                                <Checkbox
                                    checked={
                                        allItemsSelected
                                    }

                                    indeterminate={
                                        someItemsSelected
                                    }

                                    disabled={
                                        updatingAllPurchased
                                        || Boolean(
                                            updatingSectionStorage
                                        )
                                        || Boolean(
                                            addingSectionStorage
                                        )
                                    }

                                    onChange={
                                        onToggleAllPurchased
                                    }
                                />

                            }

                            label={
                                allItemsSelected
                                    ? "Desmarcar todos"
                                    : "Marcar todos"
                            }
                        />


                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {selectedItemsCount} de{" "}
                            {items.length}{" "}
                            {
                                items.length === 1
                                    ? "producto marcado"
                                    : "productos marcados"
                            }
                        </Typography>

                    </Box>

                </CardContent>

            </Card>


            {/* NAVEGACIÓN RÁPIDA */}

            <Card
                sx={{
                    borderRadius: 3,
                    mb: 3,
                }}
            >

                <CardContent>

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                            mb: 2,
                        }}
                    >
                        Ir a sección
                    </Typography>


                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.5,
                        }}
                    >

                        {sections.map(
                            (section) => (

                                <Button
                                    key={
                                        section.storage
                                    }

                                    variant="outlined"

                                    onClick={() =>
                                        scrollToSection(
                                            section.storage
                                        )
                                    }

                                    sx={{
                                        textTransform:
                                            "none",

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    {section.icon}{" "}
                                    {section.title}
                                </Button>

                            )
                        )}

                    </Box>

                </CardContent>

            </Card>


            {/* SECCIONES */}

            {sections.map(
                (section) => {

                    const sectionItems =
                        getItemsByStorage(
                            section.storage
                        );


                    return renderSection({
                        key:
                            section.storage,

                        storage:
                            section.storage,

                        title:
                            section.title,

                        icon:
                            section.icon,

                        sectionItems,

                        allowInventoryActions:
                            true,
                    });

                }
            )}


            {/* SIN UBICACIÓN */}

            {
                itemsWithoutValidStorage.length > 0
                && renderSection({
                    key:
                        "without-storage",

                    storage:
                        "without-storage",

                    title:
                        "Sin ubicación",

                    icon:
                        "📦",

                    sectionItems:
                        itemsWithoutValidStorage,

                    allowInventoryActions:
                        false,
                })
            }


            {/* VOLVER ARRIBA */}

            <Fab
                color="primary"
                size="medium"

                onClick={
                    scrollToTop
                }

                aria-label="Volver arriba"

                sx={{
                    position: "fixed",

                    right: {
                        xs: 16,
                        sm: 24,
                    },

                    bottom: {
                        xs: 16,
                        sm: 24,
                    },
                }}
            >
                <KeyboardArrowUpIcon />
            </Fab>

        </Box>

    );

}


export default ShoppingList;