import TextInput from "../forms/TextInput";
import NumberInput from "../forms/NumberInput";
import PriceInput from "../forms/PriceInput";
import SelectInput from "../forms/SelectInput";
import DateInput from "../forms/DateInput";


function ProductForm({
    productName,
    onProductNameChange,

    quantity,
    onQuantityChange,

    price,
    onPriceChange,

    storage,
    onStorageChange,
    storageError,

    expirationDate,
    onExpirationDateChange,

    openingDate,
    onOpeningDateChange,

    daysAfterOpening,
    onDaysAfterOpeningChange,

    multiLotMode = false,
}) {

    const showExpirationDate =
        storage !== "Mueble de limpieza";

    const showOpeningDate =
        storage === "Nevera"
        || storage === "Despensa";


    return (
        <>

            <TextInput
                label="Nombre del producto"
                value={productName}
                onChange={(event) =>
                    onProductNameChange(
                        event.target.value
                    )
                }
                autoFocus
            />


            <NumberInput
                label="Cantidad"
                value={quantity}
                onChange={(event) =>
                    onQuantityChange(
                        event.target.value
                    )
                }
                disabled={multiLotMode}
                helperText={
                    multiLotMode
                        ? "Gestionada por lotes"
                        : ""
                }
            />


            <SelectInput
                label="Ubicación"
                value={storage}
                onChange={(event) =>
                    onStorageChange(
                        event.target.value
                    )
                }
                error={storageError}
                helperText={
                    storageError
                        ? "Selecciona una ubicación."
                        : ""
                }
                options={[
                    {
                        value: "",
                        label: "Selecciona una ubicación",
                    },
                    {
                        value: "Nevera",
                        label: "Nevera",
                    },
                    {
                        value: "Congelador",
                        label: "Congelador",
                    },
                    {
                        value: "Despensa",
                        label: "Despensa",
                    },
                    {
                        value: "Mueble de limpieza",
                        label: "Mueble de limpieza",
                    },
                ]}
            />


            {showExpirationDate && (

                <DateInput
                    label="Fecha de caducidad"
                    value={expirationDate}
                    onChange={(event) =>
                        onExpirationDateChange(
                            event.target.value
                        )
                    }
                        disabled={multiLotMode}
                        helperText={multiLotMode ? "Gestionada por lotes" : ""}
                    />

            )}


            {showOpeningDate && (

                <DateInput
                    label="Fecha de apertura"
                    value={openingDate}
                    onChange={(event) =>
                        onOpeningDateChange(
                            event.target.value
                        )
                    }
                        disabled={multiLotMode}
                        helperText={multiLotMode ? "Gestionada por lotes" : ""}
                    />

            )}


            {showOpeningDate && (

                <NumberInput
                    label="Duración una vez abierto (días)"
                    value={daysAfterOpening}
                    onChange={(event) =>
                        onDaysAfterOpeningChange(
                            event.target.value
                        )
                    }
                />

            )}


            <PriceInput
                label="Precio (€)"
                value={price}
                onChange={(event) =>
                    onPriceChange(
                        event.target.value
                    )
                }
            />

        </>
    );
}


export default ProductForm;