function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        color: "#2E7D32",
      }}
    >
      Cargando...
    </div>
  );
}

export default RouteLoadingFallback;