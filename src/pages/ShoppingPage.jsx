import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import BackToHomeButton from "../components/layout/BackToHomeButton";

import ShoppingForm from "../components/shopping/ShoppingForm";
import ShoppingList from "../components/shopping/ShoppingList";
import ShoppingDuplicateDialog from "../components/shopping/ShoppingDuplicateDialog";
import ShoppingInventoryWarningDialog from "../components/shopping/ShoppingInventoryWarningDialog";

import ConfirmDialog from "../components/common/ConfirmDialog";

import useHome from "../hooks/useHome";

import {
  addShoppingItem,
  getShoppingItems,
  updateShoppingItem,
  updateShoppingItemsPurchased,
  deleteShoppingItem,
  deleteShoppingItems,
  findDuplicateShoppingItem,
  normalizeProductName,
} from "../services/shoppingService";

import {
  getHomeProducts,
} from "../services/homeInventoryService";
import {
  addShoppingItemToInventory,
  addShoppingSectionToInventory,
} from "../services/productStatusService";


function ShoppingPage() {

  const { home } = useHome();


  const [items, setItems] =
    useState([]);


  const [productName, setProductName] =
    useState("");


  const [quantity, setQuantity] =
    useState(1);


  const [storage, setStorage] =
    useState("");


  const [
    storageError,
    setStorageError,
  ] = useState(false);


  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [
    updatingQuantityId,
    setUpdatingQuantityId,
  ] = useState(null);


  const [
    updatingAllPurchased,
    setUpdatingAllPurchased,
  ] = useState(false);


  const [
    updatingSectionStorage,
    setUpdatingSectionStorage,
  ] = useState(null);


  const [
    addingToInventoryId,
    setAddingToInventoryId,
  ] = useState(null);


  const [
    addingSectionStorage,
    setAddingSectionStorage,
  ] = useState(null);


  const [
    deleteSectionDialogOpen,
    setDeleteSectionDialogOpen,
  ] = useState(false);


  const [
    selectedSection,
    setSelectedSection,
  ] = useState(null);


  const [
    duplicateDialogOpen,
    setDuplicateDialogOpen,
  ] = useState(false);


  const [
    duplicateProductName,
    setDuplicateProductName,
  ] = useState("");


  const [
    existingDuplicateName,
    setExistingDuplicateName,
  ] = useState("");


  const [
    inventoryStockWarning,
    setInventoryStockWarning,
  ] = useState(null);

  const [error, setError] =
    useState("");


  const loadShoppingItems = useCallback(async () => {

    if (!home) {

      setItems([]);

      setLoading(false);

      return;

    }


    try {

      setError("");


      const data =
        await getShoppingItems(
          home.id
        );


      setItems(data);

    } catch (error) {

      console.error(
        "Error al cargar la lista de la compra:",
        error
      );


      setError(
        "No se ha podido cargar la lista de la compra."
      );

    } finally {

      setLoading(false);

    }

  }, [home]);


  useEffect(() => {

    loadShoppingItems();

  }, [loadShoppingItems]);


  function handleQuantityChange(event) {

    const value =
      event.target.value;


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
      !Number.isInteger(
        numericValue
      )
      || numericValue < 1
    ) {
      return;
    }


    setQuantity(
      numericValue
    );

  }


  function handleStorageChange(value) {

    setStorage(value);

    setStorageError(false);

  }


  function showDuplicateDialog(
    attemptedName,
    existingName
  ) {

    document.activeElement
      ?.blur();


    setDuplicateProductName(
      attemptedName
    );


    setExistingDuplicateName(
      existingName || ""
    );


    setDuplicateDialogOpen(
      true
    );

  }


  function getActiveInventoryMatches(products, name) {
    const normalizedName = normalizeProductName(name);
    if (!normalizedName || !Array.isArray(products)) {
      return [];
    }

    return products.filter((product) => (
      normalizeProductName(product.name) === normalizedName
      && Number(product.quantity) > 0
      && product.isOutOfStock !== true
    ));
  }

  async function createManualShoppingItem(item) {
    await addShoppingItem(home.id, item);

    setProductName("");
    setQuantity(1);
    setStorage("");
    setStorageError(false);

    await loadShoppingItems();
  }

  async function handleConfirmInventoryStockWarning() {
    if (!home || !inventoryStockWarning || saving) {
      return;
    }

    setSaving(true);

    try {
      setError("");
      await createManualShoppingItem(inventoryStockWarning.item);
      setInventoryStockWarning(null);
    } catch (error) {
      console.error("Error al añadir el producto a la lista de la compra:", error);
      setError("No se ha podido añadir el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem(event) {
    event.preventDefault();

    if (!home || saving) {
      return;
    }

    if (!productName.trim()) {
      setError("Introduce el nombre del producto.");
      return;
    }

    const numericQuantity = Number(quantity);
    if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }

    if (!storage) {
      setStorageError(true);
      setError("Selecciona una ubicación para el producto.");
      return;
    }

    const trimmedProductName = productName.trim();
    const duplicateItem = findDuplicateShoppingItem(items, trimmedProductName);
    if (duplicateItem) {
      setError("");
      showDuplicateDialog(trimmedProductName, duplicateItem.name);
      return;
    }

    const item = {
      name: trimmedProductName,
      quantity: numericQuantity,
      storage,
      purchased: false,
    };

    try {
      setSaving(true);
      setError("");
      setStorageError(false);

      const inventoryProducts = await getHomeProducts(home.id);
      const inventoryMatches = getActiveInventoryMatches(
        inventoryProducts,
        trimmedProductName
      );

      if (inventoryMatches.length > 0) {
        document.activeElement?.blur();
        setInventoryStockWarning({ item, matches: inventoryMatches });
        return;
      }

      await createManualShoppingItem(item);
    } catch (error) {
      console.error("Error al añadir el producto a la lista de la compra:", error);
      setError("No se ha podido comprobar el Inventario o añadir el producto.");
    } finally {
      setSaving(false);
    }
  }
  async function handleTogglePurchased(item) {

    if (!home) {
      return;
    }


    try {

      setError("");


      await updateShoppingItem(
        home.id,
        item.id,
        {
          purchased:
            !item.purchased,
        }
      );


      setItems(
        (currentItems) =>
          currentItems.map(
            (currentItem) =>
              currentItem.id === item.id
                ? {
                  ...currentItem,

                  purchased:
                    !item.purchased,
                }
                : currentItem
          )
      );

    } catch (error) {

      console.error(
        "Error al actualizar el producto de la lista:",
        error
      );


      setError(
        "No se ha podido actualizar el producto."
      );

    }

  }


  async function handleToggleAllPurchased() {

    if (
      !home
      || items.length === 0
      || updatingAllPurchased
      || updatingSectionStorage
    ) {
      return;
    }


    const allPurchased =
      items.every(
        (item) =>
          Boolean(
            item.purchased
          )
      );


    const newPurchasedState =
      !allPurchased;


    try {

      setUpdatingAllPurchased(
        true
      );

      setError("");


      await updateShoppingItemsPurchased(
        home.id,
        items,
        newPurchasedState
      );


      setItems(
        (currentItems) =>
          currentItems.map(
            (currentItem) => ({
              ...currentItem,

              purchased:
                newPurchasedState,
            })
          )
      );

    } catch (error) {

      console.error(
        "Error al marcar o desmarcar todos los productos:",
        error
      );


      setError(
        "No se han podido actualizar todos los productos."
      );

    } finally {

      setUpdatingAllPurchased(
        false
      );

    }

  }


  async function handleToggleSectionPurchased(
    section
  ) {

    if (
      !home
      || !section
      || section.items.length === 0
      || updatingAllPurchased
      || updatingSectionStorage
    ) {
      return;
    }


    const allSectionPurchased =
      section.items.every(
        (item) =>
          Boolean(
            item.purchased
          )
      );


    const newPurchasedState =
      !allSectionPurchased;


    try {

      setUpdatingSectionStorage(
        section.storage
      );

      setError("");


      await updateShoppingItemsPurchased(
        home.id,
        section.items,
        newPurchasedState
      );


      const sectionIds =
        new Set(
          section.items.map(
            (item) =>
              item.id
          )
        );


      setItems(
        (currentItems) =>
          currentItems.map(
            (currentItem) =>

              sectionIds.has(
                currentItem.id
              )
                ? {
                  ...currentItem,

                  purchased:
                    newPurchasedState,
                }
                : currentItem
          )
      );

    } catch (error) {

      console.error(
        "Error al marcar o desmarcar la sección:",
        error
      );


      setError(
        "No se han podido actualizar los productos de esta sección."
      );

    } finally {

      setUpdatingSectionStorage(
        null
      );

    }

  }


  async function handleItemQuantityChange(
    item,
    newQuantity
  ) {

    if (!home) {
      return;
    }


    if (
      updatingQuantityId === item.id
    ) {
      return;
    }


    if (
      !Number.isInteger(
        newQuantity
      )
      || newQuantity < 1
    ) {
      return;
    }


    if (
      newQuantity ===
      Number(item.quantity)
    ) {
      return;
    }


    try {

      setUpdatingQuantityId(
        item.id
      );

      setError("");


      await updateShoppingItem(
        home.id,
        item.id,
        {
          quantity:
            newQuantity,
        }
      );


      setItems(
        (currentItems) =>
          currentItems.map(
            (currentItem) =>
              currentItem.id === item.id
                ? {
                  ...currentItem,

                  quantity:
                    newQuantity,
                }
                : currentItem
          )
      );

    } catch (error) {

      console.error(
        "Error al actualizar la cantidad de la lista:",
        error
      );


      setError(
        "No se ha podido actualizar la cantidad."
      );

    } finally {

      setUpdatingQuantityId(
        null
      );

    }

  }


  async function handleAddToInventory(item) {

    if (!home) {
      return;
    }


    if (
      addingToInventoryId === item.id
    ) {
      return;
    }


    try {

      setAddingToInventoryId(
        item.id
      );

      setError("");


      await addShoppingItemToInventory(
        home.id,
        item
      );


      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !== item.id
          )
      );

    } catch (error) {

      console.error(
        "Error al añadir el producto al inventario:",
        error
      );


      setError(
        "No se ha podido añadir el producto al inventario."
      );

    } finally {

      setAddingToInventoryId(
        null
      );

    }

  }


  async function handleAddSectionToInventory(
    section
  ) {

    if (!home) {
      return;
    }


    if (
      !section
      || section.items.length === 0
    ) {
      return;
    }


    const markedItems =
      section.items.filter(
        (item) =>
          Boolean(
            item.purchased
          )
      );


    if (
      markedItems.length === 0
    ) {
      return;
    }


    if (addingSectionStorage) {
      return;
    }


    try {

      setAddingSectionStorage(
        section.storage
      );

      setError("");


      await addShoppingSectionToInventory(
        home.id,
        markedItems
      );


      const transferredIds =
        new Set(
          markedItems.map(
            (item) =>
              item.id
          )
        );


      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              !transferredIds.has(
                currentItem.id
              )
          )
      );

    } catch (error) {

      console.error(
        "Error al añadir los productos marcados al inventario:",
        error
      );


      setError(
        "No se han podido añadir los productos marcados al inventario."
      );

    } finally {

      setAddingSectionStorage(
        null
      );

    }

  }


  function handleRequestDeleteSection(
    section
  ) {

    if (
      !section
      || section.items.length === 0
    ) {
      return;
    }


    document.activeElement
      ?.blur();


    setSelectedSection(
      section
    );


    setDeleteSectionDialogOpen(
      true
    );

  }


  async function handleDeleteSection() {

    if (
      !home
      || !selectedSection
    ) {
      return;
    }


    try {

      setError("");


      await deleteShoppingItems(
        home.id,
        selectedSection.items
      );


      const deletedIds =
        new Set(
          selectedSection.items.map(
            (item) =>
              item.id
          )
        );


      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              !deletedIds.has(
                currentItem.id
              )
          )
      );


      setDeleteSectionDialogOpen(
        false
      );


      setSelectedSection(
        null
      );

    } catch (error) {

      console.error(
        "Error al eliminar la sección de la lista de la compra:",
        error
      );


      setError(
        "No se ha podido eliminar la sección."
      );

    }

  }


  async function handleDeleteItem(item) {

    if (!home) {
      return;
    }


    try {

      setError("");


      await deleteShoppingItem(
        home.id,
        item.id
      );


      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !== item.id
          )
      );

    } catch (error) {

      console.error(
        "Error al eliminar el producto de la lista:",
        error
      );


      setError(
        "No se ha podido eliminar el producto."
      );

    }

  }


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
        Lista de la compra
      </Typography>


      <Typography
        color="text.secondary"
        sx={{
          mb: 4,
        }}
      >
        Gestiona los productos que necesitas comprar.
      </Typography>


      <Card
        sx={{
          borderRadius: 3,
          mb: 3,
        }}
      >

        <CardContent>

          <ShoppingForm
            productName={
              productName
            }

            onProductNameChange={
              setProductName
            }

            quantity={
              quantity
            }

            onQuantityChange={
              handleQuantityChange
            }

            storage={
              storage
            }

            onStorageChange={
              handleStorageChange
            }

            storageError={
              storageError
            }

            onSubmit={
              handleAddItem
            }

            saving={
              saving
            }
          />


          {error && (

            <Typography
              color="error"
              sx={{
                mt: 2,
              }}
            >
              {error}
            </Typography>

          )}

        </CardContent>

      </Card>


      <ShoppingList
        items={
          items
        }

        loading={
          loading
        }

        updatingQuantityId={
          updatingQuantityId
        }

        updatingAllPurchased={
          updatingAllPurchased
        }

        updatingSectionStorage={
          updatingSectionStorage
        }

        addingToInventoryId={
          addingToInventoryId
        }

        addingSectionStorage={
          addingSectionStorage
        }

        onTogglePurchased={
          handleTogglePurchased
        }

        onToggleAllPurchased={
          handleToggleAllPurchased
        }

        onToggleSectionPurchased={
          handleToggleSectionPurchased
        }

        onQuantityChange={
          handleItemQuantityChange
        }

        onAddToInventory={
          handleAddToInventory
        }

        onAddSectionToInventory={
          handleAddSectionToInventory
        }

        onRequestDeleteSection={
          handleRequestDeleteSection
        }

        onDelete={
          handleDeleteItem
        }
      />


      <ConfirmDialog
        open={
          deleteSectionDialogOpen
        }

        title={
          selectedSection
            ? `Eliminar lista ${selectedSection.title}`
            : "Eliminar lista"
        }

        message={
          selectedSection
            ? `¿Seguro que deseas eliminar todos los productos de la sección "${selectedSection.title}"?`
            : ""
        }

        onCancel={() => {

          setDeleteSectionDialogOpen(
            false
          );

          setSelectedSection(
            null
          );

        }}

        onConfirm={
          handleDeleteSection
        }
      />


      <ShoppingInventoryWarningDialog
        open={inventoryStockWarning !== null}
        productName={inventoryStockWarning?.item.name || ""}
        matches={inventoryStockWarning?.matches || []}
        saving={saving}
        onCancel={() => setInventoryStockWarning(null)}
        onConfirm={handleConfirmInventoryStockWarning}
      />

      <ShoppingDuplicateDialog
        open={
          duplicateDialogOpen
        }

        productName={
          duplicateProductName
        }

        existingProductName={
          existingDuplicateName
        }

        onClose={() => {

          setDuplicateDialogOpen(
            false
          );

          setDuplicateProductName(
            ""
          );

          setExistingDuplicateName(
            ""
          );

        }}
      />

    </Box>

  );

}


export default ShoppingPage;
