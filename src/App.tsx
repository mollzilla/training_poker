import { useState, useEffect } from 'react'
import {
  useCreateRoomMutation,
  useJoinRoomMutation,
  useGetRoomQuery,
  useGetRoomByNameQuery,
  useGetUsersQuery,
  useGetVotesQuery,
  useCastVoteMutation,
  useClearVotesMutation,
  useUpdateRoomMutation,
  useLeaveRoomMutation,
  useGetAdminDataQuery
} from './store/store'
import { MAX_ANSWER_LENGTH } from './store/api'
import './App.css'

function App() {
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joiningRoomName, setJoiningRoomName] = useState<string | null>(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showConfirmFlush, setShowConfirmFlush] = useState(false)
  const [dbFlushError, setDbFlushError] = useState<string | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')

  const [createRoom, { isLoading: isCreatingRoom }] = useCreateRoomMutation()
  const [joinRoom, { isLoading: isJoiningRoom }] = useJoinRoomMutation()
  const [leaveRoom] = useLeaveRoomMutation()
  const [castVote, { isLoading: isVoting }] = useCastVoteMutation()
  const [clearVotes] = useClearVotesMutation()
  const [updateRoom, { isLoading: isUpdatingRoom }] = useUpdateRoomMutation()

  const { 
    data: room,
    isLoading: isLoadingRoom,
    error: roomError
  } = useGetRoomQuery(currentRoom ?? '', { 
    skip: !currentRoom,
    pollingInterval: 1000
  })
  
  const {
    data: roomsByName = [],
  } = useGetRoomByNameQuery(joiningRoomName ?? '', {
    skip: !joiningRoomName
  })

  const { 
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError
  } = useGetUsersQuery(currentRoom ?? '', { 
    skip: !currentRoom,
    pollingInterval: 1000
  })
  
  const { 
    data: votes = [],
    isLoading: isLoadingVotes,
    error: votesError
  } = useGetVotesQuery(currentRoom ?? '', { 
    skip: !currentRoom,
    pollingInterval: 1000
  })

  const {
    data: existingRooms = [],
  } = useGetRoomByNameQuery(roomName.trim(), {
    skip: !roomName.trim()
  })

  const { data: adminData } = useGetAdminDataQuery(undefined, {
    skip: !isAdmin,
    pollingInterval: 1000
  })

  useEffect(() => {
    setError(null)
  }, [currentRoom])

  useEffect(() => {
    const joinRoomByName = async () => {
      if (roomsByName && roomsByName.length > 0 && userName && joiningRoomName) {
        try {
          const roomToJoin = roomsByName[0]
          const user = await joinRoom({
            name: userName.trim(),
            roomId: roomToJoin.id,
            role: 'player'
          }).unwrap()

          setCurrentRoom(roomToJoin.id)
          setCurrentUser(user.id)
          setRoomName('')
          setJoiningRoomName(null)
        } catch (err) {
          setError('Failed to join room. Please try again.')
          console.error('Join room error:', err)
          setJoiningRoomName(null)
        }
      } else if (joiningRoomName) {
        setError('Room not found. Please check the room name and try again.')
        setJoiningRoomName(null)
      }
    }

    if (joiningRoomName) {
      joinRoomByName()
    }
  }, [roomsByName, userName, joiningRoomName, joinRoom])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (userName.trim() && roomName.trim()) {
      if (existingRooms && existingRooms.length > 0) {
        setError('A room with this name already exists. Please choose another name.')
        return
      }

      try {
        const newRoom = await createRoom({
          name: roomName.trim(),
          createdBy: userName.trim(),
          showVotes: false,
          roundNumber: 1,
          currentQuestion: null,
        }).unwrap()

        const user = await joinRoom({
          name: userName.trim(),
          roomId: newRoom.id,
          role: 'croupier'
        }).unwrap()

        setCurrentRoom(newRoom.id)
        setCurrentUser(user.id)
        setRoomName('')
      } catch (err) {
        setError('Failed to create room. Please try again.')
        console.error('Create room error:', err)
      }
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (userName.trim() && roomName.trim()) {
      setJoiningRoomName(roomName.trim())
    }
  }

  const handleSubmitQuestion = async () => {
    if (currentRoom && currentUser && currentQuestion.trim()) {
      try {
        if (currentQuestion.length > MAX_ANSWER_LENGTH) {
          setError(`Question must be ${MAX_ANSWER_LENGTH} characters or less`)
          return
        }
        
        if (room) {
          await updateRoom({
            ...room,
            currentQuestion: {
              id: crypto.randomUUID(),
              text: currentQuestion.trim(),
              timestamp: Date.now()
            }
          }).unwrap()
          setCurrentQuestion('')
        }
      } catch (err) {
        setError('Failed to submit question. Please try again.')
        console.error('Question submission error:', err)
      }
    }
  }

  const handleSubmitAnswer = async () => {
    if (currentRoom && currentUser && currentAnswer.trim() && room?.currentQuestion) {
      try {
        if (currentAnswer.length > MAX_ANSWER_LENGTH) {
          setError(`Answer must be ${MAX_ANSWER_LENGTH} characters or less`)
          return
        }
        await castVote({
          userId: currentUser,
          roomId: currentRoom,
          questionId: room.currentQuestion.id,
          answer: currentAnswer.trim(),
          timestamp: Date.now()
        }).unwrap()
        setCurrentAnswer('')
      } catch (err) {
        setError('Failed to submit answer. Please try again.')
        console.error('Answer submission error:', err)
      }
    }
  }

  const handleReveal = async () => {
    if (room) {
      try {
        await updateRoom({ ...room, showVotes: true }).unwrap()
      } catch (err) {
        setError('Failed to reveal answers. Please try again.')
        console.error('Reveal answers error:', err)
      }
    }
  }

  const handleNewRound = async () => {
    if (room) {
      try {
        // Update the room to reset the state but keep votes history
        await updateRoom({ 
          ...room, 
          showVotes: false, 
          currentQuestion: null,
          roundNumber: (room.roundNumber ?? 1) + 1
        }).unwrap()
        
        // Reset local state
        setCurrentQuestion('')
        setCurrentAnswer('')
      } catch (err) {
        setError('Failed to start new round. Please try again.')
        console.error('New round error:', err)
      }
    }
  }

  const handleLeave = async () => {
    if (currentUser) {
      try {
        await leaveRoom(currentUser).unwrap()
        setCurrentRoom(null)
        setCurrentUser(null)
      } catch (err) {
        setError('Failed to leave room. Please try again.')
        console.error('Leave room error:', err)
      }
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === 'administrator') {
      setIsAdmin(true)
      setAdminPassword('')
      setShowAdminLogin(false)
    } else {
      setError('Invalid admin password')
    }
  }

  const handleFlushDb = async () => {
    try {
      setDbFlushError(null)

      // Delete all records from each collection
      const collections = ['rooms', 'users', 'votes']
      await Promise.all(collections.map(async (collection) => {
        const response = await fetch(`http://localhost:3000/${collection}`, {
          method: 'GET',
        })
        const items = await response.json()
        
        // Delete each item in the collection
        await Promise.all(items.map((item: { id: string }) => 
          fetch(`http://localhost:3000/${collection}/${item.id}`, {
            method: 'DELETE',
          })
        ))
      }))
      
      setError('Database flushed successfully')
      setShowConfirmFlush(false)
    } catch (err) {
      setDbFlushError('Failed to flush database. Please try again.')
      console.error('Flush error:', err)
    }
  }

  const adminPanel = (
    <>
      {!isAdmin && !showAdminLogin && (
        <button 
          onClick={() => setShowAdminLogin(true)}
          className="admin-login-button"
        >
          Log in as admin
        </button>
      )}

      {showAdminLogin && !isAdmin && (
        <div className="admin-login-panel">
          <div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="admin-password-input"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <button 
              onClick={handleAdminLogin}
              className="admin-submit-button"
            >
              Login
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {isAdmin && (
        <div className="admin-panel">
          <div className="db-content">
            <div className="db-header">
              <h3>Database Content</h3>
              <button 
                onClick={() => setIsAdmin(false)} 
                className="leave-admin-button"
                title="Exit admin mode"
              >
                Leave Admin Mode
              </button>
            </div>
            <pre>
              {JSON.stringify(
                adminData ?? {
                  rooms: [],
                  users: [],
                  votes: []
                },
                null,
                2
              )}
            </pre>
          </div>
          {dbFlushError && <div className="error-message">{dbFlushError}</div>}
          <button 
            onClick={() => setShowConfirmFlush(true)}
            className="flush-button"
          >
            Flush DB
          </button>

          {showConfirmFlush && (
            <>
              <div className="modal-overlay" onClick={() => setShowConfirmFlush(false)} />
              <div className="confirm-modal">
                <h3>Confirm Database Flush</h3>
                <p>Are you sure you want to flush the database? This action cannot be undone.</p>
                <div className="modal-buttons">
                  <button 
                    onClick={() => setShowConfirmFlush(false)}
                    className="admin-submit-button"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleFlushDb}
                    className="flush-button"
                  >
                    Confirm Flush
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )

  const isCroupier = users.find(u => u.id === currentUser)?.role === 'croupier'
  const nonCroupierUsers = users.filter(u => u.role === 'player')
  const currentQuestionVotes = room?.currentQuestion?.id 
    ? votes.filter(v => {
        const voter = users.find(u => u.id === v.userId)
        return v.questionId === room.currentQuestion?.id && voter?.role === 'player'
      })
    : []
  const allVoted = nonCroupierUsers.length > 0 && currentQuestionVotes.length >= nonCroupierUsers.length
  const isLoading = isLoadingRoom || isLoadingUsers || isLoadingVotes

  if (!currentRoom) {
    return (
      <div className="container">
        <h1>Welcome to Training Poker</h1>
        <div className="login-container">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="name-input"
            disabled={isCreatingRoom || isJoiningRoom}
          />
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room ID or name"
            className="room-input"
            disabled={isCreatingRoom || isJoiningRoom}
          />
          <div className="button-group">
            <button 
              onClick={handleCreateRoom} 
              className="create-button"
              disabled={isCreatingRoom || isJoiningRoom}
            >
              {isCreatingRoom ? 'Creating...' : 'Create Room'}
            </button>
            <button 
              onClick={handleJoinRoom} 
              className="join-button"
              disabled={isCreatingRoom || isJoiningRoom}
            >
              {isJoiningRoom ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
        {adminPanel}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container">
        <h1>Welcome to Training Poker</h1>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (roomError || usersError || votesError) {
    return (
      <div className="container">
        <h1>Training Poker</h1>
        <div className="error-message">
          An error occurred. Please refresh the page or try again later.
        </div>
        <button onClick={handleLeave} className="leave-button">Leave Room</button>
      </div>
    )
  }

  return (
    <div className="container" id="active-room">
      <h1>Welcome to Training Poker</h1>
      {/* Room link temporarily disabled
        {isCroupier && (
          <div className="room-info">
            <p className="room-link">
              Room link: <span className="link-text">{`${window.location.origin}?room=${room?.name}`}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}?room=${room?.name}`)}
                className="copy-link-button"
                title="Copy room link"
              >
                Copy
              </button>
            </p>
          </div>
        )}
      */}
      <div className="room-container">
        <div className="room-header">
          <div>
            <h2>Room: {room?.name}</h2>
            <div className="round-indicator">Round {room?.roundNumber ?? 1}</div>
          </div>
          <button onClick={handleLeave} className="leave-button">Leave Room</button>
        </div>

        {room?.currentQuestion && (
          <div className="current-question">
            <h2>{room.currentQuestion.text}</h2>
          </div>
        )}

        <div className="users-list">
          {users.map((user) => {
            const hasVoted = votes.some(v => 
              v.userId === user.id && 
              room?.currentQuestion?.id === v.questionId
            )
            const isUserCroupier = user.role === 'croupier'
            const hasCroupierPostedQuestion = isUserCroupier && room?.currentQuestion !== null

            return (
              <div 
                key={user.id} 
                className={`user-item ${!isUserCroupier && hasVoted ? 'has-voted' : ''} ${hasCroupierPostedQuestion ? 'has-posted-question' : ''}`}
              >
                <span>{user.name} ({user.role})</span>
                {room?.showVotes && room?.currentQuestion?.id && !isUserCroupier && (
                  <div className="answer-display">
                    {votes.find(v => 
                      v.userId === user.id && 
                      v.questionId === room.currentQuestion?.id
                    )?.answer || '...'}
                  </div>
                )}
                <div className="indicator-light red"></div>
                <div className="indicator-light orange"></div>
                <div className="indicator-light yellow"></div>
              </div>
            )
          })}
        </div>

        <div className="answer-area">
          <div className="answer-input-container">
            {isCroupier ? (
              <>
                <textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Write your question (300 characters max)..."
                  className="answer-input"
                  disabled={room?.currentQuestion !== null || isUpdatingRoom}
                  maxLength={MAX_ANSWER_LENGTH}
                />
                <div className="character-count">
                  {currentQuestion.length}/{MAX_ANSWER_LENGTH}
                </div>
                <button
                  onClick={handleSubmitQuestion}
                  className="submit-button"
                  disabled={room?.currentQuestion !== null || isUpdatingRoom || !currentQuestion.trim()}
                >
                  {isUpdatingRoom ? 'Submitting...' : 'Post Question'}
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={room?.currentQuestion ? 'Write your answer...' : 'Waiting for question...'}
                  className="answer-input"
                  disabled={!room?.currentQuestion || room?.showVotes || isVoting}
                  maxLength={MAX_ANSWER_LENGTH}
                />
                <div className="character-count">
                  {currentAnswer.length}/{MAX_ANSWER_LENGTH}
                </div>
                <button
                  onClick={handleSubmitAnswer}
                  className="submit-button"
                  disabled={!room?.currentQuestion || room?.showVotes || isVoting || !currentAnswer.trim()}
                >
                  {isVoting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </>
            )}
          </div>
        </div>

        {isCroupier && (
          <div className="controls">
            {!room?.showVotes ? (
              <button 
                onClick={handleReveal} 
                className="reveal-button"
                disabled={!allVoted || isUpdatingRoom}
              >
                Reveal Answers
              </button>
            ) : (
              <button 
                onClick={handleNewRound} 
                className="new-round-button"
                disabled={isUpdatingRoom}
              >
                New Round
              </button>
            )}
          </div>
        )}
      </div>
      {adminPanel}
    </div>
  )
}

export default App
