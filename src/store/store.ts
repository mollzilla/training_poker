import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Enable refetchOnFocus and refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispect = typeof store.dispatch;

// Export hooks
export const {
  // Admin hooks
  useGetAdminDataQuery,
  useResetDatabaseMutation,
  // Room hooks
  useGetRoomsQuery,
  useGetRoomQuery,
  useGetRoomByNameQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  // User hooks
  useGetUsersQuery,
  useJoinRoomMutation,
  useLeaveRoomMutation,
  // Vote hooks
  useGetVotesQuery,
  useCastVoteMutation,
  useClearVotesMutation,
} = api;
