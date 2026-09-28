import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import Button from "@mui/material/Button";

import {
    useState,
    useEffect,
} from "react";

import ProductForm from "./ProductForm";

import useHome from "../../hooks/useHome";

import {
    addHomeProduct,
    updateHomeProduct,
} from "../../services/homeInventoryService";

import {
    addMovement,
} from "../../services/movementHistoryService";

import {
    materializeLegacyProductLots,
} from "../../services/inventoryLotService";


function ProductDialog({
    open,
    product,
    onClose,
    onProductCreated,
}) {

    const [productName, setProductName] =
        useState("");

    const [quantity, setQuantity] =
        useState(1);

    const [price, setPrice] =
        useState(0);

    const [storage, setStorage] =
        useState("");

    const [storageError, setStorageError] =
        useState(false);

    const [expirationDate, setExpirationDate] =
        useState("");

    const [openingDate, setOpeningDate] =
        useState("");

    const [
        daysAfterOpening,
        setDaysAfterOpening,
    ] = useState("");


    const { home } = useHome();


    useEffect(() => {

        if (product) {

            setProductName(
                product.name || ""
            );


            setQuantity(
                Number.isInteger(
                    Number(product.quantity)
                )
                    && Number(product.quantity) >= 0
                    ? Number(product.quantity)
                    : 0
            );


            setPrice(
                product.price !== undefined
                    && product.price !== null
                    ? product.price
                    : 0
            );


            setStorage(
                product.storage || ""
            );


            setStorageError(false);


            setExpirationDate(
                product.expirationDate === "--"
                    ? ""
                    : product.expirationDate || ""
            );


            setOpeningDate(
                product.openingDate === "--"
                    ? ""
                    : product.openingDate || ""
            );


            setDaysAfterOpening(
                Number.isInteger(
                    Number(
                        product.daysAfterOpening
                    )
                )
                    && Number(
                        product.daysAfterOpening
                    ) > 0
                    ? Number(
                        product.daysAfterOpening
                    )
                    : ""
            );

        } else {

            setProductName("");
            setQuantity(1);
            setPrice(0);
            setStorage("");
            setStorageError(false);
            setExpirationDate("");
            setOpeningDate("");
            setDaysAfterOpening("");

        }

    }, [product]);


    function handleQuantityChange(value) {

        if (value === "") {
            setQuantity("");
            return;
        }


        if (!/^\d+$/.test(value)) {
            return;
        }


        const numericValue =
            Number(value);


        if (
            !Number.isInteger(numericValue)
            || numericValue < 0
        ) {
            return;
        }


        setQuantity(numericValue);

    }


    function handlePriceChange(value) {

        if (value === "") {
            setPrice("");
            return;
        }


        const numericValue =
            Number(value);


        if (
            Number.isNaN(numericValue)
            || numericValue < 0
        ) {
            return;
        }


        setPrice(value);

    }


    function handleDaysAfterOpeningChange(
        value
    ) {

        if (value === "") {

            setDaysAfterOpening("");

            return;

        }


        if (!/^\d+$/.test(value)) {
            return;
        }


        const numericValue =
            Number(value);


        if (
            !Number.isInteger(
                numericValue
            )
            || numericValue < 1
        ) {
            return;
        }


        setDaysAfterOpening(
            numericValue
        );

    }


    function handleStorageChange(value) {

        setStorage(value);

        setStorageError(false);


        if (
            value !== "Nevera"
            && value !== "Despensa"
        ) {

            setOpeningDate("");

            setDaysAfterOpening("");

        }


        if (
            value === "Mueble de limpieza"
        ) {

            setExpirationDate("");

        }

    }


    async function handleSave() {

        if (!productName.trim()) {
            return;
        }


        if (!home) {
            return;
        }


        if (!storage) {

            setStorageError(true);

            return;

        }


        const numericQuantity =
            Number(quantity);

        const numericPrice =
            Number(price);


        if (
            !Number.isInteger(numericQuantity)
            || numericQuantity < 0
        ) {
            return;
        }


        if (
            Number.isNaN(numericPrice)
            || numericPrice < 0
        ) {
            return;
        }


        const canHaveOpeningData =
            storage === "Nevera"
            || storage === "Despensa";


        let validDaysAfterOpening =
            "";


        if (
            canHaveOpeningData
            && daysAfterOpening !== ""
        ) {

            const numericDaysAfterOpening =
                Number(
                    daysAfterOpening
                );


            if (
                !Number.isInteger(
                    numericDaysAfterOpening
                )
                || numericDaysAfterOpening < 1
            ) {
                return;
            }


            validDaysAfterOpening =
                numericDaysAfterOpening;

        }


        const validExpirationDate =
            storage === "Mueble de limpieza"
                ? ""
                : expirationDate;


        const validOpeningDate =
            canHaveOpeningData
                ? openingDate
                : "";


        const productData = {
            name: productName.trim(),

            quantity:
                numericQuantity,

            price:
                numericPrice,

            storage,

            expirationDate:
                validExpirationDate,

            openingDate:
                validOpeningDate,

            daysAfterOpening:
                validDaysAfterOpening,
        };


        if (product) {

            const previousQuantity =
                Number.isInteger(
                    Number(product.quantity)
                )
                    && Number(product.quantity) >= 0
                    ? Number(product.quantity)
                    : 0;


            await updateHomeProduct(
                home.id,
                product.id,
                productData
            );


            const quantityChange =
                numericQuantity
                - previousQuantity;


            if (quantityChange !== 0) {

                await addMovement(
                    home.id,
                    {
                        productId:
                            product.id,

                        productName:
                            productData.name,

                        type:
                            quantityChange > 0
                                ? "increase"
                                : "decrease",

                        quantityChange,

                        previousQuantity,

                        newQuantity:
                            numericQuantity,
                    }
                );

            }

        } else {

            const createdProduct =
                await addHomeProduct(
                    home.id,
                    productData
                );


            /*
             * G.7F.1
             *
             * Si el producto nace ya con fecha de apertura,
             * no podemos dejar su lote únicamente como virtual.
             *
             * Lo materializamos inmediatamente para que
             * "Deshacer apertura" tenga un documento físico
             * real al que volver y pueda revertir la apertura
             * sin errores.
             *
             * Si openingDate está vacío, mantenemos el flujo
             * normal: el lote podrá seguir siendo virtual hasta
             * la primera operación que necesite materializarlo.
             */
            if (
                numericQuantity > 0
                && validOpeningDate
            ) {

                await materializeLegacyProductLots(
                    home.id,
                    createdProduct.id
                );

            }


            if (numericQuantity > 0) {

                await addMovement(
                    home.id,
                    {
                        productId:
                            createdProduct.id,

                        productName:
                            productData.name,

                        type:
                            "increase",

                        quantityChange:
                            numericQuantity,

                        previousQuantity:
                            0,

                        newQuantity:
                            numericQuantity,
                    }
                );

            }

        }


        if (onProductCreated) {

            await onProductCreated();

        }


        setProductName("");
        setQuantity(1);
        setPrice(0);
        setStorage("");
        setStorageError(false);
        setExpirationDate("");
        setOpeningDate("");
        setDaysAfterOpening("");


        onClose();

    }


    return (

        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            disableRestoreFocus
        >

            <DialogTitle>

                {product
                    ? "Editar producto"
                    : "Nuevo producto"}

            </DialogTitle>


            <DialogContent>

                <ProductForm
                    productName={productName}
                    onProductNameChange={
                        setProductName
                    }

                    quantity={quantity}
                    onQuantityChange={
                        handleQuantityChange
                    }

                    price={price}
                    onPriceChange={
                        handlePriceChange
                    }

                    storage={storage}
                    onStorageChange={
                        handleStorageChange
                    }

                    storageError={
                        storageError
                    }

                    expirationDate={
                        expirationDate
                    }
                    onExpirationDateChange={
                        setExpirationDate
                    }

                    openingDate={
                        openingDate
                    }
                    onOpeningDateChange={
                        setOpeningDate
                    }

                    daysAfterOpening={
                        daysAfterOpening
                    }
                    onDaysAfterOpeningChange={
                        handleDaysAfterOpeningChange
                    }
                />

            </DialogContent>


            <DialogActions>

                <Button
                    onClick={onClose}
                >
                    Cancelar
                </Button>


                <Button
                    variant="contained"
                    onClick={handleSave}
                >
                    Guardar
                </Button>

            </DialogActions>

        </Dialog>

    );

    
}


export default ProductDialog;