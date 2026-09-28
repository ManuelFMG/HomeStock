export const MEMBER_ROLES = {
  OWNER: "owner",
  MEMBER: "member",
};

export const createEmptyHome = () => ({
  id: "",
  name: "",
  members: [],
  createdAt: null,
  updatedAt: null,
});