import ConfirmDialog from "../components/common/ConfirmDialog";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import useHome from "../hooks/useHome";

import PageContainer from "../components/layout/PageContainer";
import PageTitle from "../components/layout/PageTitle";
import SectionCard from "../components/layout/SectionCard";

import ProductList from "../components/inventory/ProductList";

import {
  getHomeProducts,
  deleteHomeProduct,
} from "../services/homeInventoryService";

import {
  getHomeInventoryLots,
} from "../services/inventoryLotService";

import Box from "@mui/material/Box";

import ActionButton from "../components/common/ActionButton";

import ProductDialog from "../components/inventory/ProductDialog";

import BackToDashboard from "../components/layout/BackToDashboard";


function InventoryPage() {

  const [products, setProducts] =
    useState([]);

  const [inventoryLots, setInventoryLots] =
    useState([]);

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);


  const { home } = useHome();


  const loadInventoryData = useCallback(async () => {

    if (!home) {

      setProducts([]);
      setInventoryLots([]);

      return;

    }


    const [
      productsData,
      lotsData,
    ] =
      await Promise.all([
        getHomeProducts(
          home.id
        ),
        getHomeInventoryLots(
          home.id
        ),
      ]);


    setProducts(
      productsData
    );

    setInventoryLots(
      lotsData
    );

  }, [home]);


  function handleProductQuantityChange(
    productId,
    quantity,
    additionalData = {}
  ) {

    setProducts(
      (currentProducts) =>

        currentProducts.map(
          (product) =>

            product.id === productId
              ? {
                ...product,
                quantity,
                ...additionalData,
              }
              : product
        )

    );

  }


  async function handleDelete() {

    if (
      !home
      || !selectedProduct
    ) {
      return;
    }


    await deleteHomeProduct(
      home.id,
      selectedProduct.id,
      selectedProduct.lotIds || []
    );


    setDeleteDialogOpen(false);

    setSelectedProduct(null);

    await loadInventoryData();

  }


  useEffect(() => {

    if (home) {

      loadInventoryData();

    }

  }, [home, loadInventoryData]);


  return (

    <PageContainer>

      <BackToDashboard />


      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >

        <PageTitle>
          Inventario
        </PageTitle>


        <ActionButton
          onClick={() =>
            setDialogOpen(true)
          }
        >
          + Añadir producto
        </ActionButton>

      </Box>


      <SectionCard>

        <ProductList
          products={products}
          inventoryLots={inventoryLots}

          onEdit={(product) => {

            setSelectedProduct(
              product
            );

            setDialogOpen(true);

          }}

          onDelete={(product) => {

            document.activeElement
              ?.blur();

            setSelectedProduct(
              product
            );

            setDeleteDialogOpen(
              true
            );

          }}

          onQuantityChange={
            handleProductQuantityChange
          }

          onInventoryRefresh={
            loadInventoryData
          }
        />

      </SectionCard>


      <ProductDialog
        open={dialogOpen}
        product={selectedProduct}

        onClose={() => {

          setDialogOpen(false);

          setSelectedProduct(null);

        }}

        onProductCreated={
          loadInventoryData
        }
      />


      <ConfirmDialog
        open={deleteDialogOpen}

        title="Eliminar producto"

        message={
          selectedProduct
            ? `¿Seguro que deseas eliminar "${selectedProduct.name}"?`
            : ""
        }

        onCancel={() => {

          setDeleteDialogOpen(false);

          setSelectedProduct(null);

        }}

        onConfirm={
          handleDelete
        }
      />

    </PageContainer>

  );

}


export default InventoryPage;
