import {

  alpha,

} from "@mui/material/styles";



import {

  Card,

  CardContent,

  Typography,

  Box,

  Button,

  Chip,

  IconButton,

  TextField,

} from "@mui/material";



import RemoveIcon from "@mui/icons-material/Remove";

import AddIcon from "@mui/icons-material/Add";



import {

  useEffect,

  useState,

} from "react";



import useHome from "../../hooks/useHome";



import {

  updateHomeProduct,

} from "../../services/homeInventoryService";



import {

  addMovement,

} from "../../services/movementHistoryService";



import {

  markProductOutOfStock,

  addOutOfStockProductToShopping,

  reactivateProduct,

} from "../../services/productStatusService";



import ProductStatusDialog from "./ProductStatusDialog";



import OpeningStatusDialog from "./OpeningStatusDialog";



import {

  findDuplicateShoppingItemByHome,

} from "../../services/shoppingService";



import ShoppingDuplicateDialog from "../shopping/ShoppingDuplicateDialog";



import {

  splitInventoryLotForOpening,

  undoInventoryLotOpening,

  consumeProductStockFromLots,

  addProductStockAsNewLot,

  addUnitToMultiLotFamily,

  markMultiProductOutOfStockWithLots,

  reactivateMultiProductWithLots,

} from "../../services/inventoryLotService";





function ProductCard({

  product,

  lots = [],

  onEdit,

  onDelete,

  onQuantityChange,

  onInventoryRefresh,

}) {





  const [

    duplicateDialogOpen,

    setDuplicateDialogOpen,

  ] = useState(false);



  const [

    duplicateExistingName,

    setDuplicateExistingName,

  ] = useState("");



  const [quantity, setQuantity] =

    useState(

      product.quantity ?? 0

    );





  const [

    openingDate,

    setOpeningDate,

  ] = useState(

    product.openingDate || ""

  );





  const [

    isOutOfStock,

    setIsOutOfStock,

  ] = useState(

    Boolean(

      product.isOutOfStock

    )

  );





  const [

    quantityBeforeOutOfStock,

    setQuantityBeforeOutOfStock,

  ] = useState(

    product.quantityBeforeOutOfStock

    ?? null

  );





  const [

    shoppingItemId,

    setShoppingItemId,

  ] = useState(

    product.outOfStockShoppingItemId

    || ""

  );





  const [

    savingQuantity,

    setSavingQuantity,

  ] = useState(false);





  const [

    savingOpeningDate,

    setSavingOpeningDate,

  ] = useState(false);





  const [

    openingDialogOpen,

    setOpeningDialogOpen,

  ] = useState(false);





  const [

    savingStatus,

    setSavingStatus,

  ] = useState(false);





  const [

    statusDialogMode,

    setStatusDialogMode,

  ] = useState(null);





  const [

    savingLotOpeningId,

    setSavingLotOpeningId,

  ] = useState("");





  const [

    openingQuantityByLot,

    setOpeningQuantityByLot,

  ] = useState({});





  const [

    savingLotUndoOpeningId,

    setSavingLotUndoOpeningId,

  ] = useState("");





  const { home } =

    useHome();





  const isMultiLot =

    product.usesLots === true

    && product.lotStrategy === "multi";





  useEffect(() => {



    setQuantity(

      product.quantity ?? 0

    );



  }, [

    product.id,

    product.quantity,

  ]);





  useEffect(() => {



    setOpeningDate(

      product.openingDate || ""

    );



  }, [

    product.id,

    product.openingDate,

  ]);





  useEffect(() => {



    setIsOutOfStock(

      Boolean(

        product.isOutOfStock

      )

    );





    setQuantityBeforeOutOfStock(

      product.quantityBeforeOutOfStock

      ?? null

    );





    setShoppingItemId(

      product.outOfStockShoppingItemId

      || ""

    );



  }, [

    product.id,

    product.isOutOfStock,

    product.quantityBeforeOutOfStock,

    product.outOfStockShoppingItemId,

  ]);





  function formatDate(date) {



    if (

      !date

      || date === "--"

    ) {

      return "--";

    }





    const [

      year,

      month,

      day,

    ] = date.split("-");





    return `${day}-${month}-${year}`;



  }





  function calculateOpeningDeadline(

    openingDateValue,

    daysAfterOpeningValue

  ) {



    if (

      !openingDateValue

      || openingDateValue === "--"

    ) {

      return "";

    }





    const numericDays =

      Number(

        daysAfterOpeningValue

      );





    if (

      !Number.isInteger(

        numericDays

      )

      || numericDays < 1

    ) {

      return "";

    }





    const [

      year,

      month,

      day,

    ] =

      openingDateValue

        .split("-")

        .map(Number);





    if (

      !year

      || !month

      || !day

    ) {

      return "";

    }





    const deadline =

      new Date(

        Date.UTC(

          year,

          month - 1,

          day + numericDays

        )

      );





    const deadlineYear =

      deadline.getUTCFullYear();





    const deadlineMonth =

      String(

        deadline.getUTCMonth() + 1

      ).padStart(

        2,

        "0"

      );





    const deadlineDay =

      String(

        deadline.getUTCDate()

      ).padStart(

        2,

        "0"

      );





    return `${deadlineYear}-${deadlineMonth}-${deadlineDay}`;



  }





  function getLotOriginLabel(origin) {



    if (origin === "shopping") {

      return "Lista de la compra";

    }





    if (origin === "legacy") {

      return "Stock anterior";

    }





    return "Entrada manual";



  }





  const visibleLots =

    Array.isArray(lots)

      ? lots.filter(

        (lot) =>

          Number(lot?.quantity) > 0

      )

      : [];





  /*

   * AGRUPACIÓN VISUAL DE LOTES

   *

   * Los documentos creados por una apertura parcial

   * siguen perteneciendo al mismo lote principal.

   *

   * splitFromLotId nos permite mantener esa familia

   * unida visualmente y evitar "Lote 1, Lote 2,

   * Lote 3..." cada vez que se abre una unidad.

   */

  const lotGroups =

    visibleLots.reduce(

      (groups, lot) => {



        const groupId =

          String(

            lot.splitFromLotId

            || lot.id

          );





        let group =

          groups.find(

            (currentGroup) =>

              currentGroup.id ===

              groupId

          );





        if (!group) {



          group = {

            id:

              groupId,



            origin:

              lot.origin,



            expirationDate:

              lot.expirationDate,



            segments: [],

          };





          groups.push(

            group

          );



        }





        group.segments.push(

          lot

        );





        return groups;



      },

      []

    )

      .map(

        (group) => {



          const rootSegment =

            group.segments.find(

              (segment) =>

                segment.id ===

                group.id

            );





          const referenceSegment =

            rootSegment

            || group.segments[0];





          const createdAt =

            referenceSegment

              ?.createdAt;





          const createdAtMillis =

            typeof createdAt?.toMillis ===

              "function"

              ? createdAt.toMillis()

              : typeof createdAt?.seconds ===

                "number"

                ? createdAt.seconds * 1000

                : 0;





          return {

            ...group,

            createdAtMillis,

          };



        }

      )

      .sort(

        (groupA, groupB) => {



          if (

            groupA.createdAtMillis !==

            groupB.createdAtMillis

          ) {



            return (

              groupA.createdAtMillis

              - groupB.createdAtMillis

            );



          }





          return String(

            groupA.id

          ).localeCompare(

            String(

              groupB.id

            )

          );



        }

      );





  function formatPrice(price) {



    if (

      price === null

      || price === undefined

      || price === ""

    ) {

      return "0,00 €";

    }





    return `${Number(price)

      .toFixed(2)

      .replace(".", ",")} €`;



  }





  function calculateTotalPrice(

    price,

    currentQuantity

  ) {



    const productPrice =

      Number(price) || 0;





    const productQuantity =

      Number(currentQuantity) || 0;





    return (

      productPrice

      * productQuantity

    );



  }





  function getTodayLocalDate() {



    const today =

      new Date();





    const year =

      today.getFullYear();





    const month =

      String(

        today.getMonth() + 1

      ).padStart(

        2,

        "0"

      );





    const day =

      String(

        today.getDate()

      ).padStart(

        2,

        "0"

      );





    return `${year}-${month}-${day}`;



  }





  async function handleAddLotAwareUnit() {
    if (!home || savingQuantity || isOutOfStock || !isMultiLot) {
      return;
    }

    setSavingQuantity(true);

    try {
      const result = await addProductStockAsNewLot(
        home.id,
        product.id,
        1,
        {
          expirationDate: "",
          openingDate: "",
          origin: "manual",
        }
      );

      await addMovement(
        home.id,
        {
          productId: product.id,
          productName: product.name,
          type: "increase",
          quantityChange: 1,
          previousQuantity: result.previousQuantity,
          newQuantity: result.newQuantity,
        }
      );

      setQuantity(result.newQuantity);

      if (onQuantityChange) {
        await onQuantityChange(product.id, result.newQuantity);
      }

      if (onInventoryRefresh) {
        await onInventoryRefresh();
      }
    } catch (error) {
      console.error("Error al añadir una unidad por lotes:", error);
    } finally {
      setSavingQuantity(false);
    }
  }
  async function handleAddLotFamilyUnit(lotGroup) {
    if (!home || savingQuantity || isOutOfStock || !isMultiLot) {
      return;
    }

    setSavingQuantity(true);

    try {
      const result = await addUnitToMultiLotFamily(
        home.id,
        product.id,
        visibleLots.map(lot => lot.id),
        lotGroup.segments.map(segment => segment.id)
      );

      setQuantity(result.newQuantity);

      if (onQuantityChange) {
        await onQuantityChange(product.id, result.newQuantity);
      }

      if (onInventoryRefresh) {
        await onInventoryRefresh();
      }
    } catch (error) {
      console.error("Error al añadir una unidad al lote:", error);
    } finally {
      setSavingQuantity(false);
    }
  }

  async function handleConsumeLotFamilyUnit(lotGroup) {
    if (!home || savingQuantity || isOutOfStock || quantity <= 0 || !isMultiLot) {
      return;
    }

    setSavingQuantity(true);

    try {
      const result = await consumeProductStockFromLots(
        home.id,
        product.id,
        visibleLots.map(lot => lot.id),
        lotGroup.segments.map(segment => segment.id)
      );

      setQuantity(result.newQuantity);

      if (result.becameOutOfStock) {
        setIsOutOfStock(true);
        setQuantityBeforeOutOfStock(0);
        setShoppingItemId("");
        if (onQuantityChange) {
          await onQuantityChange(product.id, 0, {
            isOutOfStock: true,
            quantityBeforeOutOfStock: 0,
            outOfStockShoppingItemId: "",
          });
        }
      }

      if (onInventoryRefresh) {
        await onInventoryRefresh();
      }

      if (result.becameOutOfStock) {
        document.activeElement?.blur();
        setStatusDialogMode("shopping");
      }
    } catch (error) {
      console.error("Error al consumir una unidad del lote:", error);
    } finally {
      setSavingQuantity(false);
    }
  }
  async function handleConsumeLotAwareUnit() {
    if (!home || savingQuantity || isOutOfStock || quantity <= 0 || !isMultiLot) {
      return;
    }

    setSavingQuantity(true);

    try {
      const result = await consumeProductStockFromLots(
        home.id,
        product.id,
        visibleLots.map(lot => lot.id)
      );

      setQuantity(result.newQuantity);

      if (result.becameOutOfStock) {
        setIsOutOfStock(true);
        setQuantityBeforeOutOfStock(0);
        setShoppingItemId("");
        if (onQuantityChange) {
          await onQuantityChange(product.id, 0, {
            isOutOfStock: true,
            quantityBeforeOutOfStock: 0,
            outOfStockShoppingItemId: "",
          });
        }
      }

      if (onInventoryRefresh) {
        await onInventoryRefresh();
      }

      if (result.becameOutOfStock) {
        document.activeElement?.blur();
        setStatusDialogMode("shopping");
      }
    } catch (error) {
      console.error("Error al consumir una unidad por lotes:", error);
    } finally {
      setSavingQuantity(false);
    }
  }

  async function handleQuantityChange(

    newQuantity

  ) {



    if (

      savingQuantity

      || isOutOfStock

      || isMultiLot

    ) {

      return;

    }





    if (newQuantity < 0) {

      return;

    }





    if (

      !Number.isInteger(

        newQuantity

      )

    ) {

      return;

    }





    if (!home) {

      return;

    }





    const previousQuantity =

      quantity;





    if (

      newQuantity ===

      previousQuantity

    ) {

      return;

    }





    const quantityChange =

      newQuantity

      - previousQuantity;





    setSavingQuantity(

      true

    );





    try {



      await updateHomeProduct(

        home.id,

        product.id,

        {

          quantity:

            newQuantity,

        }

      );





      await addMovement(

        home.id,

        {

          productId:

            product.id,



          productName:

            product.name,



          type:

            quantityChange > 0

              ? "increase"

              : "decrease",



          quantityChange,



          previousQuantity,



          newQuantity,

        }

      );





      setQuantity(

        newQuantity

      );





      if (onQuantityChange) {



        await onQuantityChange(

          product.id,

          newQuantity

        );



      }




      if (onInventoryRefresh) {

        await onInventoryRefresh();

      }
    } catch (error) {



      console.error(

        "Error al actualizar la cantidad:",

        error

      );



    } finally {



      setSavingQuantity(

        false

      );



    }



  }





  async function handleOpeningDate() {



    if (

      !home

      || isOutOfStock

      || savingOpeningDate

      || isMultiLot

    ) {

      return;

    }





    if (

      product.storage !== "Nevera"

      && product.storage !== "Despensa"

    ) {

      return;

    }





    /*

     * Si ya está abierto,

     * pedimos confirmación para deshacer.

     */



    if (openingDate) {



      document.activeElement

        ?.blur();





      setOpeningDialogOpen(

        true

      );





      return;



    }





    const today =

      getTodayLocalDate();





    setSavingOpeningDate(

      true

    );





    try {



      await updateHomeProduct(

        home.id,

        product.id,

        {

          openingDate:

            today,

        }

      );





      setOpeningDate(

        today

      );



    } catch (error) {



      console.error(

        "Error al registrar la fecha de apertura:",

        error

      );



    } finally {



      setSavingOpeningDate(

        false

      );



    }



  }





  async function handleUndoOpeningDate() {



    if (

      !home

      || !openingDate

      || isOutOfStock

      || savingOpeningDate

      || isMultiLot

    ) {

      return;

    }





    setSavingOpeningDate(

      true

    );





    try {



      await updateHomeProduct(

        home.id,

        product.id,

        {

          openingDate:

            "",

        }

      );





      setOpeningDate(

        ""

      );





      setOpeningDialogOpen(

        false

      );



    } catch (error) {



      console.error(

        "Error al deshacer la fecha de apertura:",

        error

      );



    } finally {



      setSavingOpeningDate(

        false

      );



    }



  }





  async function handleMarkOutOfStock() {



    if (

      !home

      || isOutOfStock

      || savingStatus

    ) {

      return;

    }





    setSavingStatus(true);





    try {



      const {

        previousQuantity,

      } =

        isMultiLot
          ? await markMultiProductOutOfStockWithLots(
              home.id,
              product.id,
              visibleLots.map(lot => lot.id)
            )
          : await markProductOutOfStock(

          home.id,

          {

            ...product,

            quantity,

          }

        );





      setQuantity(0);





      setIsOutOfStock(

        true

      );





      setQuantityBeforeOutOfStock(

        previousQuantity

      );





      setShoppingItemId(

        ""

      );





      if (onQuantityChange) {



        await onQuantityChange(

          product.id,

          0,

          {

            isOutOfStock:

              true,



            quantityBeforeOutOfStock:

              previousQuantity,



            outOfStockShoppingItemId:

              "",

          }

        );



      }





      document.activeElement

        ?.blur();





      setStatusDialogMode(

        "shopping"

      );



    } catch (error) {



      console.error(

        "Error al marcar el producto como agotado:",

        error

      );



    } finally {



      setSavingStatus(false);



    }



  }





  function handleReactivateClick() {



    if (

      savingStatus

      || !isOutOfStock

    ) {

      return;

    }





    document.activeElement

      ?.blur();





    setStatusDialogMode(

      "reactivate"

    );



  }





  async function handleAddToShopping() {



    if (

      !home

      || !isOutOfStock

      || savingStatus

    ) {

      return;

    }





    setSavingStatus(true);





    try {



      const duplicateItem =

        await findDuplicateShoppingItemByHome(

          home.id,

          product.name

        );





      if (duplicateItem) {



        setShoppingItemId(

          ""

        );





        if (onQuantityChange) {



          await onQuantityChange(

            product.id,

            0,

            {

              isOutOfStock:

                true,



              quantityBeforeOutOfStock,



              outOfStockShoppingItemId:

                "",

            }

          );



        }





        setStatusDialogMode(

          null

        );





        setDuplicateExistingName(

          duplicateItem.name

        );





        document.activeElement

          ?.blur();





        setDuplicateDialogOpen(

          true

        );





        return;



      }





      const suggestedQuantity =

        Number(

          quantityBeforeOutOfStock

        ) > 0

          ? Number(

            quantityBeforeOutOfStock

          )

          : 1;





      const createdShoppingItemId =

        await addOutOfStockProductToShopping(

          home.id,

          {

            ...product,

            quantity: 0,

          },

          suggestedQuantity

        );





      setShoppingItemId(

        createdShoppingItemId

      );





      if (onQuantityChange) {



        await onQuantityChange(

          product.id,

          0,

          {

            isOutOfStock:

              true,



            quantityBeforeOutOfStock,



            outOfStockShoppingItemId:

              createdShoppingItemId,

          }

        );



      }





      setStatusDialogMode(

        null

      );



    } catch (error) {



      console.error(

        "Error al comprobar o añadir el producto agotado a la Lista de la compra:",

        error

      );



    } finally {



      setSavingStatus(false);



    }



  }





  async function handleReactivate() {



    if (

      !home

      || !isOutOfStock

      || savingStatus

    ) {

      return;

    }





    setSavingStatus(true);





    try {



      const {

        restoredQuantity,

      } =

        isMultiLot
          ? await reactivateMultiProductWithLots(home.id, { productId: product.id })
          : await reactivateProduct(

          home.id,

          {

            productId:

              product.id,



            productName:

              product.name,



            quantityToRestore:

              quantityBeforeOutOfStock,



            shoppingItemId,

          }

        );





      setQuantity(

        restoredQuantity

      );





      setIsOutOfStock(

        false

      );





      setQuantityBeforeOutOfStock(

        null

      );





      setShoppingItemId(

        ""

      );





      if (onQuantityChange) {



        await onQuantityChange(

          product.id,

          restoredQuantity,

          {

            isOutOfStock:

              false,



            quantityBeforeOutOfStock:

              null,



            outOfStockShoppingItemId:

              "",

          }

        );



      }





      setStatusDialogMode(

        null

      );



      if (isMultiLot && onInventoryRefresh) {
        await onInventoryRefresh();
      }

    } catch (error) {



      console.error(

        "Error al reactivar el producto:",

        error

      );



    } finally {



      setSavingStatus(false);



    }



  }





  function getOpeningQuantityForLot(

    lot

  ) {



    const savedQuantity =

      openingQuantityByLot[

      lot.id

      ];





    if (

      savedQuantity === undefined

    ) {

      return 1;

    }





    return savedQuantity;



  }





  function handleOpeningQuantityChange(

    lot,

    value

  ) {



    if (!lot?.id) {

      return;

    }





    if (value === "") {



      setOpeningQuantityByLot(

        (currentValues) => ({

          ...currentValues,

          [lot.id]: "",

        })

      );



      return;



    }





    const numericValue =

      Number(value);





    if (

      !Number.isInteger(

        numericValue

      )

    ) {

      return;

    }





    setOpeningQuantityByLot(

      (currentValues) => ({

        ...currentValues,

        [lot.id]:

          numericValue,

      })

    );



  }





  async function handleOpenLotUnits(

    lot

  ) {



    if (

      !home

      || !lot?.id

      || lot.openingDate

      || savingLotOpeningId

    ) {

      return;

    }





    const lotQuantity =

      Number(

        lot.quantity

      );





    const quantityToOpen =

      Number(

        getOpeningQuantityForLot(

          lot

        )

      );





    if (

      !Number.isInteger(

        lotQuantity

      )

      || lotQuantity < 1

      || !Number.isInteger(

        quantityToOpen

      )

      || quantityToOpen < 1

      || quantityToOpen >

      lotQuantity

    ) {

      return;

    }





    setSavingLotOpeningId(

      lot.id

    );





    try {



      await splitInventoryLotForOpening(

        home.id,

        product.id,

        lot.id,

        quantityToOpen,

        getTodayLocalDate()

      );





      setOpeningQuantityByLot(

        (currentValues) => {



          const nextValues = {

            ...currentValues,

          };





          delete nextValues[

            lot.id

          ];





          return nextValues;



        }

      );





      if (onInventoryRefresh) {



        await onInventoryRefresh();



      }



    } catch (error) {



      console.error(

        "Error al abrir unidades del lote:",

        error

      );



    } finally {



      setSavingLotOpeningId(

        ""

      );



    }



  }





  async function handleUndoLotOpening(

    lot

  ) {



    if (

      !home

      || !lot?.id

      || !lot.openingDate

      || savingLotUndoOpeningId

      || savingLotOpeningId

    ) {

      return;

    }





    setSavingLotUndoOpeningId(

      lot.id

    );





    try {



      const familyLotIds =

        lotGroups

          .find(

            (lotGroup) =>

              lotGroup.segments.some(

                (segment) =>

                  segment.id === lot.id

              )

          )

          ?.segments.map(

            (segment) =>

              segment.id

          ) || [];





      await undoInventoryLotOpening(

        home.id,

        product.id,

        lot.id,

        familyLotIds

      );





      if (onInventoryRefresh) {



        await onInventoryRefresh();



      }



    } catch (error) {



      console.error(

        "Error al deshacer la apertura del lote:",

        error

      );



    } finally {



      setSavingLotUndoOpeningId(

        ""

      );



    }



  }





  const canRegisterOpening =

    product.storage === "Nevera"

    || product.storage === "Despensa";





  /*

   * Desde G.7E.1 la apertura se gestiona

   * siempre por unidades/lotes.

   *

   * También mostramos el lote virtual de un

   * producto legacy recién creado, para evitar

   * volver a abrir toda la cantidad de golpe.

   */

  const showLotDetails =

    !isOutOfStock

    && visibleLots.length > 0;





  const isOpened =

    Boolean(

      openingDate

    );





  return (



    <>



      <Card

        sx={(theme) => {



          /*

           * PRIORIDAD VISUAL:

           *

           * 1. Agotado → rojo

           * 2. Abierto → verde

           * 3. Normal

           */



          const backgroundColor =

            isOutOfStock

              ? alpha(

                theme.palette.error.main,

                0.1

              )

              : isOpened

                ? alpha(

                  theme.palette.success.main,

                  0.1

                )

                : theme.palette.background.paper;





          const borderColor =

            isOutOfStock

              ? alpha(

                theme.palette.error.main,

                0.3

              )

              : isOpened

                ? alpha(

                  theme.palette.success.main,

                  0.35

                )

                : "transparent";





          return {

            mb: 2,



            borderRadius: 3,



            backgroundColor,



            border:

              `1px solid ${borderColor}`,



            transition:

              "background-color 0.2s ease, border-color 0.2s ease",

          };



        }}

      >



        <CardContent>





          <Box

            sx={{

              display: "flex",

              alignItems: "center",

              justifyContent:

                "space-between",

              gap: 2,

              mb: 1,

            }}

          >



            <Typography

              variant="h6"

              fontWeight="bold"

            >

              {product.name}

            </Typography>





            {isOutOfStock ? (



              <Chip

                label="Agotado"

                color="error"

                size="small"

              />



            ) : isOpened ? (



              <Chip

                label="Abierto"

                color="success"

                size="small"

              />



            ) : null}



          </Box>





          <Box

            sx={{

              display: "flex",

              alignItems: "center",

              gap: 1,

            }}

          >



            <Typography>

              Cantidad: {quantity}

            </Typography>





            <IconButton

              size="small"



              onClick={() =>

                isMultiLot
                  ? handleConsumeLotAwareUnit()
                  : handleQuantityChange(quantity - 1)

              }



              disabled={

                savingQuantity

                || isOutOfStock

                || quantity === 0

              }



              aria-label="Disminuir cantidad"

            >

              <RemoveIcon

                fontSize="small"

              />

            </IconButton>





            <IconButton

              size="small"



              onClick={() =>

                isMultiLot
                  ? handleAddLotAwareUnit()
                  : handleQuantityChange(quantity + 1)

              }



              disabled={

                savingQuantity

                || isOutOfStock

              }



              aria-label="Aumentar cantidad"

            >

              <AddIcon

                fontSize="small"

              />

            </IconButton>



          </Box>





          <Typography>

            Precio:{" "}

            {formatPrice(

              product.price

            )}

          </Typography>





          <Typography>

            Valor:{" "}

            {formatPrice(

              calculateTotalPrice(

                product.price,

                quantity

              )

            )}

          </Typography>





          <Typography>

            Ubicación:{" "}

            {product.storage}

          </Typography>





          {!showLotDetails && (



            <Typography>

              Caduca:{" "}

              {formatDate(

                product.expirationDate

              )}

            </Typography>



          )}





          {!showLotDetails && openingDate && (



            <Typography>

              Abierto:{" "}

              {formatDate(

                openingDate

              )}

            </Typography>



          )}





          {showLotDetails && (



            <Box

              sx={{

                mt: 3,

                p: 2,

                borderRadius: 2,

                border:

                  "1px solid",

                borderColor:

                  "divider",

                backgroundColor:

                  "background.default",

              }}

            >



              <Typography

                variant="subtitle1"

                fontWeight="bold"

                sx={{

                  mb: 1.5,

                }}

              >

                Lotes · {lotGroups.length}

              </Typography>





              {lotGroups.map(

                (

                  lotGroup,

                  groupIndex

                ) => {



                  const groupQuantity =

                    lotGroup.segments.reduce(

                      (

                        total,

                        segment

                      ) =>

                        total

                        + (

                          Number(

                            segment.quantity

                          ) || 0

                        ),

                      0

                    );





                  return (



                    <Box

                      key={

                        lotGroup.id

                      }

                      sx={{

                        py: 1.5,

                        px: 1.5,

                        borderRadius: 2,

                        border:

                          "1px solid",

                        borderColor:

                          "divider",

                        backgroundColor:

                          "background.paper",

                        "& + &": {

                          mt: 1.25,

                        },

                      }}

                    >



                      <Box

                        sx={{

                          display: "flex",

                          justifyContent:

                            "space-between",

                          alignItems: {

                            xs: "flex-start",

                            sm: "center",

                          },

                          flexDirection: {

                            xs: "column",

                            sm: "row",

                          },

                          gap: 1,

                          mb: 1.25,

                        }}

                      >



                        <Box>



                          <Typography

                            fontWeight="bold"

                          >

                            Lote {groupIndex + 1}

                          </Typography>





                          <Typography

                            variant="body2"

                            color="text.secondary"

                          >

                            Total del lote:{" "}

                            {groupQuantity}{" "}

                            {

                              groupQuantity === 1

                                ? "unidad"

                                : "unidades"

                            }

                          </Typography>



                        </Box>





                        <Box

                          sx={{

                            display: "flex",

                            alignItems: "center",

                            gap: 0.25,

                          }}

                        >

                          <IconButton

                            size="small"

                            onClick={() =>

                              handleConsumeLotFamilyUnit(

                                lotGroup

                              )

                            }

                            disabled={

                              savingQuantity

                              || isOutOfStock

                              || groupQuantity <= 0

                              || savingLotOpeningId !== ""

                              || savingLotUndoOpeningId !== ""

                            }

                            aria-label={`Reducir lote ${groupIndex + 1}`}

                          >

                            <RemoveIcon

                              fontSize="small"

                            />

                          </IconButton>



                          <IconButton

                            size="small"

                            onClick={() =>

                              handleAddLotFamilyUnit(

                                lotGroup

                              )

                            }

                            disabled={

                              savingQuantity

                              || isOutOfStock

                              || savingLotOpeningId !== ""

                              || savingLotUndoOpeningId !== ""

                            }

                            aria-label={`Aumentar lote ${groupIndex + 1}`}

                          >

                            <AddIcon

                              fontSize="small"

                            />

                          </IconButton>



                          <Chip

                            size="small"

                            variant="outlined"

                            label={

                              getLotOriginLabel(

                                lotGroup.origin

                              )

                            }

                          />

                        </Box>



                      </Box>





                      <Typography

                        variant="body2"

                        sx={{

                          mb: 1,

                        }}

                      >

                        Caducidad del lote:{" "}

                        {formatDate(

                          lotGroup.expirationDate

                        )}

                      </Typography>





                      {lotGroup.segments.map(

                        (

                          lot,

                          segmentIndex

                        ) => {



                          const openingIndex =

                            lot.openingDate

                              ? lotGroup.segments

                                .slice(

                                  0,

                                  segmentIndex + 1

                                )

                                .filter(

                                  (segment) =>

                                    Boolean(

                                      segment.openingDate

                                    )

                                )

                                .length

                              : 0;





                          const lotQuantity =

                            Number(

                              lot.quantity

                            ) || 0;





                          const openingDeadline =

                            calculateOpeningDeadline(

                              lot.openingDate,

                              product.daysAfterOpening

                            );





                          const quantityToOpen =

                            getOpeningQuantityForLot(

                              lot

                            );





                          const numericQuantityToOpen =

                            Number(

                              quantityToOpen

                            );





                          const openingQuantityIsValid =

                            Number.isInteger(

                              numericQuantityToOpen

                            )

                            && numericQuantityToOpen >= 1

                            && numericQuantityToOpen <=

                            lotQuantity;





                          return (



                            <Box

                              key={

                                lot.id

                                || `${lotGroup.id}-${segmentIndex}`

                              }

                              sx={(theme) => ({

                                mt:

                                  segmentIndex === 0

                                    ? 0

                                    : 1,

                                p: 1.25,

                                borderRadius: 2,

                                border:

                                  "1px solid",

                                borderColor:

                                  lot.openingDate

                                    ? alpha(

                                      theme.palette.success.main,

                                      0.28

                                    )

                                    : theme.palette.divider,

                                backgroundColor:

                                  lot.openingDate

                                    ? alpha(

                                      theme.palette.success.main,

                                      0.06

                                    )

                                    : theme.palette.background.default,

                              })}

                            >



                              <Box

                                sx={{

                                  display: "flex",

                                  justifyContent:

                                    "space-between",

                                  alignItems: "center",

                                  gap: 1,

                                  flexWrap: "wrap",

                                  mb: 0.75,

                                }}

                              >



                                <Typography

                                  variant="body2"

                                  fontWeight="bold"

                                >

                                  {

                                    lot.openingDate

                                      ? `Apertura ${openingIndex}`

                                      : "Stock sin abrir"

                                  }

                                </Typography>





                                <Chip

                                  size="small"

                                  color={

                                    lot.openingDate

                                      ? "success"

                                      : "default"

                                  }

                                  label={

                                    lot.openingDate

                                      ? "Abierto"

                                      : "Sin abrir"

                                  }

                                />



                              </Box>





                              <Typography

                                variant="body2"

                              >

                                Cantidad:{" "}

                                {lotQuantity}{" "}

                                {

                                  lotQuantity === 1

                                    ? "unidad"

                                    : "unidades"

                                }

                              </Typography>





                              {

                                lot.openingDate

                                && (



                                  <Typography

                                    variant="body2"

                                  >

                                    Apertura:{" "}

                                    {formatDate(

                                      lot.openingDate

                                    )}

                                  </Typography>



                                )

                              }





                              {

                                lot.openingDate

                                && openingDeadline

                                && (



                                  <Box

                                    sx={{

                                      mt: 0.75,

                                    }}

                                  >



                                    <Typography

                                      variant="body2"

                                      fontWeight={600}

                                    >

                                      Consumir antes de:{" "}

                                      {formatDate(

                                        openingDeadline

                                      )}

                                    </Typography>





                                    <Typography

                                      variant="caption"

                                      color="text.secondary"

                                    >

                                      Plazo tras apertura:{" "}

                                      {Number(

                                        product.daysAfterOpening

                                      )}{" "}

                                      {

                                        Number(

                                          product.daysAfterOpening

                                        ) === 1

                                          ? "día"

                                          : "días"

                                      }

                                    </Typography>



                                  </Box>



                                )

                              }





                              {

                                lot.openingDate

                                  ? (



                                    <Button

                                      size="small"

                                      variant="outlined"

                                      color="success"

                                      disabled={

                                        savingLotUndoOpeningId !== ""

                                        || savingLotOpeningId !== ""

                                      }

                                      onClick={() =>

                                        handleUndoLotOpening(

                                          lot

                                        )

                                      }

                                      sx={{

                                        mt: 1,

                                        textTransform:

                                          "none",

                                      }}

                                    >

                                      {

                                        savingLotUndoOpeningId ===

                                          lot.id

                                          ? "Deshaciendo..."

                                          : "Deshacer apertura"

                                      }

                                    </Button>



                                  )

                                  : canRegisterOpening

                                    ? (



                                      <Box

                                        sx={{

                                          mt: 1,

                                        }}

                                      >



                                        <Typography

                                          variant="caption"

                                          color="text.secondary"

                                          sx={{

                                            display: "block",

                                            mb: 0.75,

                                            fontWeight: 600,

                                          }}

                                        >

                                          Registrar apertura

                                        </Typography>





                                        <Box

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

                                            gap: 1,

                                          }}

                                        >



                                          {

                                            lotQuantity > 1

                                            && (



                                              <TextField

                                                size="small"

                                                type="number"

                                                label="Unidades a abrir"

                                                value={

                                                  quantityToOpen

                                                }

                                                disabled={

                                                  savingLotOpeningId !== ""

                                                  || savingLotUndoOpeningId !== ""

                                                }

                                                onChange={(event) =>

                                                  handleOpeningQuantityChange(

                                                    lot,

                                                    event.target.value

                                                  )

                                                }

                                                slotProps={{

                                                  htmlInput: {

                                                    min: 1,

                                                    max:

                                                      lotQuantity,

                                                    step: 1,

                                                  },

                                                }}

                                                sx={{

                                                  width: {

                                                    xs: "100%",

                                                    sm: 170,

                                                  },

                                                }}

                                              />



                                            )

                                          }





                                          <Button

                                            size="small"

                                            variant="outlined"

                                            color="success"

                                            disabled={

                                              savingLotOpeningId !== ""

                                              || savingLotUndoOpeningId !== ""

                                              || !openingQuantityIsValid

                                            }

                                            onClick={() =>

                                              handleOpenLotUnits(

                                                lot

                                              )

                                            }

                                            sx={{

                                              textTransform:

                                                "none",

                                              alignSelf: {

                                                xs: "stretch",

                                                sm: "center",

                                              },

                                            }}

                                          >

                                            {

                                              savingLotOpeningId ===

                                                lot.id

                                                ? "Abriendo..."

                                                : numericQuantityToOpen === 1

                                                  ? "Abrir 1 unidad"

                                                  : `Abrir ${numericQuantityToOpen} unidades`

                                            }

                                          </Button>



                                        </Box>



                                      </Box>



                                    )

                                    : null

                              }



                            </Box>



                          );



                        }

                      )}



                    </Box>



                  );



                }

              )}



            </Box>



          )}





          <Box

            sx={{

              display: "flex",

              justifyContent:

                "space-between",

              alignItems: "center",

              gap: 2,

              mt: 3,

              flexWrap: "wrap",

            }}

          >



            <Box

              sx={{

                display: "flex",

                gap: 1.5,

                flexWrap: "wrap",

              }}

            >



              <Button

                variant={

                  isOutOfStock

                    ? "contained"

                    : "outlined"

                }



                color={

                  isOutOfStock

                    ? "success"

                    : "error"

                }



                disabled={

                  savingStatus

                }



                onClick={

                  isOutOfStock

                    ? handleReactivateClick

                    : handleMarkOutOfStock

                }

              >

                {isOutOfStock

                  ? "Reactivar"

                  : "Agotado"}

              </Button>





              {

                canRegisterOpening

                && !showLotDetails

                && (



                  <Button

                    variant={

                      openingDate

                        ? "contained"

                        : "outlined"

                    }



                    color="success"



                    onClick={

                      handleOpeningDate

                    }



                    disabled={

                      isOutOfStock

                      || savingOpeningDate

                      || isMultiLot

                    }

                  >

                    {openingDate

                      ? "Deshacer apertura"

                      : "Marcar apertura"}

                  </Button>



                )

              }



            </Box>





            <Box

              sx={{

                display: "flex",

                gap: 2,

                ml: "auto",

              }}

            >



              <Button

                variant="outlined"



                disabled={

                  isOutOfStock

                }



                onClick={() =>

                  onEdit({

                    ...product,

                    quantity,

                    openingDate,

                    isOutOfStock,

                    quantityBeforeOutOfStock,

                    outOfStockShoppingItemId:

                      shoppingItemId,

                  })

                }

              >

                Editar

              </Button>





              <Button

                color="error"

                variant="contained"



                onClick={() =>

                  onDelete({

                    ...product,

                    lotIds:

                      visibleLots.map(
                        (lot) => lot.id
                      ),

                  })

                }

              >

                Eliminar

              </Button>



            </Box>



          </Box>



        </CardContent>



      </Card>





      <ProductStatusDialog

        open={

          statusDialogMode !==

          null

        }



        mode={

          statusDialogMode

        }



        productName={

          product.name

        }



        saving={

          savingStatus

        }



        onCancel={() =>

          setStatusDialogMode(

            null

          )

        }



        onConfirm={

          statusDialogMode ===

            "shopping"

            ? handleAddToShopping

            : handleReactivate

        }

      />





      <OpeningStatusDialog

        open={

          openingDialogOpen

        }



        productName={

          product.name

        }



        saving={

          savingOpeningDate

        }



        onCancel={() =>

          setOpeningDialogOpen(

            false

          )

        }



        onConfirm={

          handleUndoOpeningDate

        }

      />



      <ShoppingDuplicateDialog

        open={

          duplicateDialogOpen

        }



        productName={

          product.name

        }



        existingProductName={

          duplicateExistingName

        }



        onClose={() => {



          setDuplicateDialogOpen(

            false

          );



          setDuplicateExistingName(

            ""

          );



        }}

      />



    </>



  );



}





export default ProductCard;
