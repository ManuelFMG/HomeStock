export const STORAGE_TYPES = {
    FRIDGE: "fridge",
    FREEZER: "freezer",
    PANTRY: "pantry",
    CLEANING: "cleaning",
};

export const MOVEMENT_TYPES = {
    ADD: "add",
    REMOVE: "remove",
    EDIT: "edit",
};

export const UNIT_TYPES = {
    UNIT: "unit",
    BOTTLE: "bottle",
    CAN: "can",
    PACKAGE: "package",
    BOX: "box",
    JAR: "jar",
    ROLL: "roll",
};

export const PRODUCT_CATEGORIES = {
  DAIRY: "dairy",
  MEAT: "meat",
  FISH: "fish",
  FRUIT: "fruit",
  VEGETABLE: "vegetable",
  BAKERY: "bakery",
  PASTA_RICE: "pasta_rice",
  CANNED: "canned",
  SNACKS: "snacks",
  SWEETS: "sweets",
  DRINKS: "drinks",
  FROZEN: "frozen",
  CLEANING: "cleaning",
  HYGIENE: "hygiene",
  PETS: "pets",
  OTHER: "other",
};

export const createEmptyProduct = () => ({
    id: "",
    name: "",
    barcode: "",
    quantity: 0,
    unit: UNIT_TYPES.UNIT,
    storage: STORAGE_TYPES.FRIDGE,
    category: PRODUCT_CATEGORIES.OTHER,
    brand: "",
    purchasePrice: 0,
    expirationDate: null,
    createdAt: null,
    updatedAt: null,
});