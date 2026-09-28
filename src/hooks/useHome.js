import { useContext } from "react";

import HomeContext from "../context/HomeContext";

function useHome() {
  return useContext(HomeContext);
}

export default useHome;