import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

type OrgContextState = {
  /** When set, MasterAdmin API calls send X-Organisation-Id. When null, global mode. */
  masterAdminOrganisationId: number | null
}

const initialState: OrgContextState = {
  masterAdminOrganisationId: null,
}

const orgContextSlice = createSlice({
  name: "orgContext",
  initialState,
  reducers: {
    setMasterAdminOrganisationId: (state, action: PayloadAction<number | null>) => {
      state.masterAdminOrganisationId = action.payload
    },
    clearMasterAdminOrganisationId: (state) => {
      state.masterAdminOrganisationId = null
    },
  },
})

export const { setMasterAdminOrganisationId, clearMasterAdminOrganisationId } =
  orgContextSlice.actions

export const selectMasterAdminOrganisationId = (state: RootState) =>
  state.orgContext?.masterAdminOrganisationId ?? null

export default orgContextSlice.reducer
