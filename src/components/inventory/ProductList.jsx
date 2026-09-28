import {
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Fab,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import ProductCard from "./ProductCard";

import {
  groupInventoryLotsByProduct,
} from "../../services/inventoryLotService";


function ProductList({
  products,
  inventoryLots = [],
  onEdit,
  onDelete,
  onQuantityChange,
  onInventoryRefresh,
}) {

  const [searchTerm, setSearchTerm] =
    useState("");

  const [sortOption, setSortOption] =
    useState("newest");

  const topRef = useRef(null);

  const sectionRefs = useRef({});


  const lotsByProduct =
    groupInventoryLotsByProduct(
      products,
      inventoryLots
    );


  const locations = [
    {
      value: "Nevera",
      title: "Nevera",
      icon: "🧊",
    },
    {
      value: "Congelador",
      title: "Congelador",
      icon: "❄️",
    },
    {
      value: "Despensa",
      title: "Despensa",
      icon: "🥫",
    },
    {
      value: "Mueble de limpieza",
      title: "Mueble de limpieza",
      icon: "🧹",
    },
  ];


  const totalInventoryValue = products.reduce(
    (total, product) => {

      const price =
        Number(product.price) || 0;

      const quantity =
        Number(product.quantity) || 0;

      return total + (
        price * quantity
      );

    },
    0
  );


  const totalInventoryUnits = products.reduce(
    (total, product) => {

      const quantity =
        Number(product.quantity) || 0;

      return total + quantity;

    },
    0
  );


  function formatPrice(price) {

    return `${Number(price)
      .toFixed(2)
      .replace(".", ",")} €`;

  }


  function normalizeText(text) {

    return String(text || "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase();

  }


  function productMatchesSearch(
    product
  ) {

    const normalizedSearch =
      normalizeText(
        searchTerm.trim()
      );


    if (!normalizedSearch) {
      return true;
    }


    const normalizedName =
      normalizeText(
        product.name
      );


    return normalizedName.includes(
      normalizedSearch
    );

  }


  const filteredProducts =
    products.filter(
      productMatchesSearch
    );


  const searchIsActive =
    searchTerm.trim() !== "";


  const totalSearchResults =
    filteredProducts.length;


  function getCreatedAtMilliseconds(
    product
  ) {

    const createdAt =
      product.createdAt;


    if (!createdAt) {
      return 0;
    }


    if (
      typeof createdAt.toMillis ===
      "function"
    ) {

      return createdAt.toMillis();

    }


    if (
      typeof createdAt.seconds ===
      "number"
    ) {

      return (
        createdAt.seconds * 1000
      );

    }


    if (
      createdAt instanceof Date
    ) {

      return createdAt.getTime();

    }


    const parsedDate =
      new Date(createdAt);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return 0;

    }


    return parsedDate.getTime();

  }


  function getExpirationMilliseconds(
    product
  ) {

    const expirationDate =
      product.expirationDate;


    if (
      !expirationDate
      || expirationDate === "--"
    ) {
      return null;
    }


    const parsedDate =
      new Date(
        `${expirationDate}T00:00:00`
      );


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return null;
    }


    return parsedDate.getTime();

  }


  function sortProducts(
    productsToSort
  ) {

    return [
      ...productsToSort,
    ].sort(
      (productA, productB) => {

        if (
          sortOption === "newest"
        ) {

          return (
            getCreatedAtMilliseconds(
              productB
            )
            - getCreatedAtMilliseconds(
              productA
            )
          );

        }


        if (
          sortOption === "oldest"
        ) {

          return (
            getCreatedAtMilliseconds(
              productA
            )
            - getCreatedAtMilliseconds(
              productB
            )
          );

        }


        if (
          sortOption === "nameAsc"
        ) {

          return normalizeText(
            productA.name
          ).localeCompare(
            normalizeText(
              productB.name
            ),
            "es"
          );

        }


        if (
          sortOption === "nameDesc"
        ) {

          return normalizeText(
            productB.name
          ).localeCompare(
            normalizeText(
              productA.name
            ),
            "es"
          );

        }


        if (
          sortOption === "expirationAsc"
          || sortOption === "expirationDesc"
        ) {

          const dateA =
            getExpirationMilliseconds(
              productA
            );

          const dateB =
            getExpirationMilliseconds(
              productB
            );


          if (
            dateA === null
            && dateB === null
          ) {
            return 0;
          }


          if (dateA === null) {
            return 1;
          }


          if (dateB === null) {
            return -1;
          }


          if (
            sortOption === "expirationAsc"
          ) {

            return dateA - dateB;

          }


          return dateB - dateA;

        }


        return 0;

      }
    );

  }


  function getProductsByLocation(
    location
  ) {

    const locationProducts =
      filteredProducts.filter(
        (product) =>
          product.storage === location
      );


    return sortProducts(
      locationProducts
    );

  }


  function getLocationUnits(
    locationProducts
  ) {

    return locationProducts.reduce(
      (total, product) => {

        const quantity =
          Number(product.quantity) || 0;

        return total + quantity;

      },
      0
    );

  }


  function getLocationValue(
    locationProducts
  ) {

    return locationProducts.reduce(
      (total, product) => {

        const quantity =
          Number(product.quantity) || 0;

        const price =
          Number(product.price) || 0;

        return total + (
          quantity * price
        );

      },
      0
    );

  }


  function scrollToSection(location) {

    const section =
      sectionRefs.current[
      location
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

    if (!topRef.current) {
      return;
    }


    topRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  }


  function clearSearch() {

    setSearchTerm("");

  }


  const knownLocations =
    locations.map(
      (location) =>
        location.value
    );


  const productsWithoutValidLocation =
    sortProducts(
      filteredProducts.filter(
        (product) =>
          !knownLocations.includes(
            product.storage
          )
      )
    );


  function renderProductSection({
    key,
    title,
    icon,
    sectionProducts,
  }) {

    const sectionUnits =
      getLocationUnits(
        sectionProducts
      );

    const sectionValue =
      getLocationValue(
        sectionProducts
      );


    return (
      <Box
        key={key}
        ref={(element) => {

          sectionRefs.current[
            key
          ] = element;

        }}
        sx={{
          mb: 5,
          scrollMarginTop: 24,
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
            mb: 2,
          }}
        >

          <Box>

            <Typography
              variant="h5"
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
                sectionProducts.length
              }{" "}
              {
                sectionProducts.length === 1
                  ? "producto"
                  : "productos"
              }
            </Typography>

          </Box>


          <Box
            sx={{
              textAlign: {
                xs: "left",
                sm: "right",
              },
            }}
          >

            <Typography
              fontWeight="bold"
            >
              {sectionUnits}{" "}
              {
                sectionUnits === 1
                  ? "unidad"
                  : "unidades"
              }
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Valor:{" "}
              {formatPrice(
                sectionValue
              )}
            </Typography>

          </Box>

        </Box>


        <Divider
          sx={{
            mb: 2,
          }}
        />


        {sectionProducts.map(
          (product) => (

            <ProductCard
              key={product.id}
              product={product}
              lots={
                lotsByProduct.get(
                  product.id
                ) || []
              }
              onEdit={onEdit}
              onDelete={onDelete}
              onQuantityChange={
                onQuantityChange
              }
              onInventoryRefresh={
                onInventoryRefresh
              }
            />

          )
        )}

      </Box>
    );

  }


  return (
    <>

      <Box ref={topRef} />


      {/* RESUMEN GENERAL */}

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
        }}
      >

        <CardContent>

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
              gap: 3,
            }}
          >

            <Box>

              <Typography
                variant="body1"
                fontWeight="bold"
              >
                Valor total del inventario
              </Typography>

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                {formatPrice(
                  totalInventoryValue
                )}
              </Typography>

            </Box>


            <Box>

              <Typography
                variant="body1"
                fontWeight="bold"
              >
                Unidades en inventario
              </Typography>

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                {totalInventoryUnits}
              </Typography>

            </Box>

          </Box>

        </CardContent>

      </Card>


      {/* BUSCADOR Y ORDEN */}

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
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
            Buscar y ordenar
          </Typography>


          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "2fr 1fr",
              },
              gap: 2,
            }}
          >

            <TextField
              fullWidth
              label="Buscar por nombre"
              placeholder="Ejemplo: leche, café, yogur..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                    >
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment:
                    searchTerm ? (
                      <InputAdornment
                        position="end"
                      >
                        <IconButton
                          onClick={
                            clearSearch
                          }
                          edge="end"
                          aria-label="Limpiar búsqueda"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                },
              }}
            />


            <TextField
              select
              fullWidth
              label="Ordenar por"
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value
                )
              }
            >

              <MenuItem
                value="newest"
              >
                Más recientes primero
              </MenuItem>

              <MenuItem
                value="oldest"
              >
                Más antiguos primero
              </MenuItem>

              <MenuItem
                value="nameAsc"
              >
                Nombre: A → Z
              </MenuItem>

              <MenuItem
                value="nameDesc"
              >
                Nombre: Z → A
              </MenuItem>

              <MenuItem
                value="expirationAsc"
              >
                Caducidad más próxima
              </MenuItem>

              <MenuItem
                value="expirationDesc"
              >
                Caducidad más lejana
              </MenuItem>

            </TextField>

          </Box>


          {searchIsActive && (

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1.5,
              }}
            >
              {totalSearchResults}{" "}
              {
                totalSearchResults === 1
                  ? "producto encontrado"
                  : "productos encontrados"
              }
            </Typography>

          )}

        </CardContent>

      </Card>


      {/* ACCESOS RÁPIDOS */}

      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
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
            Ir a ubicación
          </Typography>


          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >

            {locations.map(
              (location) => {

                const locationProducts =
                  getProductsByLocation(
                    location.value
                  );

                const isDisabled =
                  searchIsActive
                  && locationProducts.length === 0;


                return (
                  <Button
                    key={
                      location.value
                    }
                    variant="outlined"
                    disabled={
                      isDisabled
                    }
                    onClick={() =>
                      scrollToSection(
                        location.value
                      )
                    }
                    sx={{
                      textTransform:
                        "none",
                      fontWeight: 600,
                    }}
                  >
                    {location.icon}{" "}
                    {location.title}
                  </Button>
                );

              }
            )}

          </Box>

        </CardContent>

      </Card>


      {/* SIN RESULTADOS */}

      {
        searchIsActive
        && totalSearchResults === 0
        && (

          <Card
            sx={{
              borderRadius: 3,
              mb: 4,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Sin resultados
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                }}
              >
                No hay productos que coincidan con{" "}
                "{searchTerm.trim()}".
              </Typography>

            </CardContent>

          </Card>

        )
      }


      {/* INVENTARIOS POR UBICACIÓN */}

      {
        totalSearchResults > 0
        && locations.map(
          (location) => {

            const sectionProducts =
              getProductsByLocation(
                location.value
              );


            if (
              searchIsActive
              && sectionProducts.length === 0
            ) {
              return null;
            }


            return renderProductSection({
              key:
                location.value,

              title:
                location.title,

              icon:
                location.icon,

              sectionProducts,
            });

          }
        )
      }


      {/* PRODUCTOS SIN UBICACIÓN VÁLIDA */}

      {
        productsWithoutValidLocation
          .length > 0
        && renderProductSection({
          key:
            "without-location",

          title:
            "Sin ubicación",

          icon:
            "📦",

          sectionProducts:
            productsWithoutValidLocation,
        })
      }


      {/* VOLVER ARRIBA */}

      <Fab
        color="primary"
        size="medium"
        onClick={scrollToTop}
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

    </>
  );

}


export default ProductList;