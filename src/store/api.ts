import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../config';
import { generateUUID } from '../utils/uuid';

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  showVotes: boolean;
  roundNumber?: number;
  currentWinners: string[];
  winners: Array<{
    userId: string;
    wins: number;
  }>;
  currentQuestion: {
    id: string;
    text: string;
    timestamp: number;
  } | null;
  victors: string[]; // IDs of the final victors
  showVictoryCelebration: boolean; // Whether to show the victory celebration
}

export interface User {
  id: string;
  name: string;
  roomId: string;
  role: 'croupier' | 'player';
}

export interface CreateUserRequest {
  id?: string; // Optional ID for rejoining
  name: string;
  roomId: string;
  role: 'croupier' | 'player';
}

export interface Vote {
  id: string;
  userId: string;
  roomId: string;
  questionId: string;
  answer: string;
  timestamp: number;
}

export const MAX_ANSWER_LENGTH = 300;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Room', 'User', 'Vote'],
  refetchOnFocus: true,
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Admin operations
    resetDatabase: builder.mutation<void, void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Delete all entries first
          const rooms = await fetchWithBQ('rooms')
          const users = await fetchWithBQ('users')
          const votes = await fetchWithBQ('votes')
          
          if (rooms.data) {
            for (const room of (rooms.data as Room[])) {
              await fetchWithBQ({ url: `rooms/${room.id}`, method: 'DELETE' })
            }
          }
          if (users.data) {
            for (const user of (users.data as User[])) {
              await fetchWithBQ({ url: `users/${user.id}`, method: 'DELETE' })
            }
          }
          if (votes.data) {
            for (const vote of (votes.data as Vote[])) {
              await fetchWithBQ({ url: `votes/${vote.id}`, method: 'DELETE' })
            }
          }
          return { data: undefined }
        } catch (error) {
          return { error: { status: 500, data: error } }
        }
      },
      invalidatesTags: ['Room', 'User', 'Vote']
    }),

    getAdminData: builder.query<{ rooms: Room[], users: User[], votes: Vote[] }, void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const rooms = await fetchWithBQ('rooms')
        const users = await fetchWithBQ('users')
        const votes = await fetchWithBQ('votes')
        
        if (rooms.error || users.error || votes.error) {
          return { error: { status: 500, data: 'Failed to fetch admin data' } }
        }

        return {
          data: {
            rooms: rooms.data as Room[],
            users: users.data as User[],
            votes: votes.data as Vote[],
          }
        }
      },
      providesTags: ['Room', 'User', 'Vote'],
    }),

    // Room operations
    getRooms: builder.query<Room[], void>({
      query: () => 'rooms',
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Room' as const, id })),
        { type: 'Room', id: 'LIST' }
      ]
    }),
    getRoomByName: builder.query<Room[], string>({
      query: (name) => `rooms?name=${name}`,
      providesTags: (result = []) => [
        ...(result?.map(({ id }) => ({ type: 'Room' as const, id })) ?? []),
        { type: 'Room', id: 'LIST' }
      ]
    }),
    getRoom: builder.query<Room, string>({
      query: (id) => `rooms/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Room', id }]
    }),
    createRoom: builder.mutation<Room, Omit<Room, 'id'>>({
      query: (room) => ({
        url: 'rooms',
        method: 'POST',
        body: { ...room, id: generateUUID() }
      }),
      invalidatesTags: [{ type: 'Room', id: 'LIST' }]
    }),
    updateRoom: builder.mutation<Room, Room>({
      query: (room) => ({
        url: `rooms/${room.id}`,
        method: 'PUT',
        body: room
      }),
      invalidatesTags: (_result, _error, room) => [
        { type: 'Room', id: room.id },
        { type: 'Room', id: 'LIST' },
        { type: 'Vote', id: 'LIST' }
      ]
    }),

    // User operations
    getUsers: builder.query<User[], string>({
      query: (roomId) => `users?roomId=${roomId}`,
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'User' as const, id })),
        { type: 'User', id: 'LIST' }
      ]
    }),
    getRoomUsers: builder.query<User[], string>({
      query: (roomId) => `users?roomId=${roomId}`,
      providesTags: ['User']
    }),
    joinRoom: builder.mutation<User, CreateUserRequest>({
      query: (user) => ({
        url: 'users',
        method: 'POST',
        body: { ...user, id: user.id || generateUUID() }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }]
    }),
    leaveRoom: builder.mutation<void, string>({
      query: (userId) => ({
        url: `users/${userId}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }]
    }),

    // Vote operations
    getVotes: builder.query<Vote[], string>({
      query: (roomId) => `votes?roomId=${roomId}`,
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Vote' as const, id })),
        { type: 'Vote', id: 'LIST' }
      ]
    }),
    castVote: builder.mutation<Vote, Omit<Vote, 'id'>>({
      query: (vote) => ({
        url: 'votes',
        method: 'POST',
        body: { ...vote, id: generateUUID() }
      }),
      invalidatesTags: [{ type: 'Vote', id: 'LIST' }]
    }),
    clearVotes: builder.mutation<void, string>({
      query: (roomId) => ({
        url: `votes?roomId=${roomId}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Vote', id: 'LIST' }]
    })
  })
});
