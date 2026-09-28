import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Typography,
} from "@mui/material";

import BackToHomeButton from "../components/layout/BackToHomeButton";

import StatisticsSummary from "../components/statistics/StatisticsSummary";
import StatisticsMovements from "../components/statistics/StatisticsMovements";

import useHome from "../hooks/useHome";

import {
  getHomeProducts,
} from "../services/homeInventoryService";

import {
  getMovementHistory,
} from "../services/movementHistoryService";


function StatisticsPage() {

  const { home } = useHome();

  const [products, setProducts] = useState([]);

  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  useEffect(() => {

    async function loadStatistics() {

      if (!home) {

        setProducts([]);
        setMovements([]);
        setLoading(false);

        return;
      }

      try {

        setLoading(true);
        setError("");

        const [
          productsData,
          movementsData,
        ] = await Promise.all([
          getHomeProducts(home.id),
          getMovementHistory(home.id),
        ]);

        setProducts(productsData);
        setMovements(movementsData);

      } catch (error) {

        console.error(
          "Error al cargar las estadísticas:",
          error
        );

        setError(
          "No se han podido cargar las estadísticas."
        );

      } finally {

        setLoading(false);

      }

    }

    loadStatistics();

  }, [home]);


  return (
    <Box>

      <BackToHomeButton />

      <Typography
        variant="h4"
        fontWeight={700}
      >
        Estadísticas
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        Consulta los datos de tu hogar.
      </Typography>


      {loading && (
        <Typography
          color="text.secondary"
          sx={{ mt: 4 }}
        >
          Cargando estadísticas...
        </Typography>
      )}


      {!loading && error && (
        <Typography
          color="error"
          sx={{ mt: 4 }}
        >
          {error}
        </Typography>
      )}


      {!loading && !error && (
        <>
          <StatisticsSummary
            products={products}
            movements={movements}
          />

          <StatisticsMovements
            movements={movements}
          />
        </>
      )}

    </Box>
  );
}


export default StatisticsPage;