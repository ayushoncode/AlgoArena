import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileSidebar from './ProfileSidebar'
import KeyNumbersRow from './KeyNumbersRow'
import ProfileV2Skeleton from './ProfileV2Skeleton'
import AvatarModalV2 from './AvatarModalV2'
import EditProfileModal from './EditProfileModal'
import RatingChartV2 from './RatingChartV2'
import MatchHistoryV2 from './MatchHistoryV2'
import ActivityHeatmapYear from './ActivityHeatmapYear'
import TopicBreakdownV2 from './TopicBreakdownV2'
import FootNoteV2 from './FootNoteV2'
import { getUserFriends } from '../../services/socialApi'

export default function ProfileV2View({
  authLoading,
  dataLoading,
  isOwnProfileRoute,
  notFound,
  routeUsername,
  navigate,
  activeUser,
  isMe,
  elo,
  wins,
  losses,
  wr,
  total,
  streak,
  editingUsername,
  setEditingUsername,
  newHandle,
  setNewHandle,
  handleErr,
  savingHandle,
  handleSaveUsername,
  showAvatarModal,
  setShowAvatarModal,
  handleSaveAvatar,
  handleSaveProfile,
  favTopicTitle,
  chartData = [],
  matches = [],
  activeDates = new Set(),
  topicFreq = {},
  eloHistory = [],
}) {
  const routerNav = useNavigate()
  const doNavigate = navigate || routerNav

  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [friendsCount, setFriendsCount] = useState(activeUser?.friends_count ?? 0)

  useEffect(() => {
    if (activeUser?.username) {
      let active = true
      getUserFriends(activeUser.username)
        .then(res => {
          if (!active) return
          setFriendsCount(res.totalCount || res.friends?.length || 0)
        })
        .catch(() => {})
      return () => { active = false }
    }
  }, [activeUser?.username])

  // Set page document title according to accessibility and SEO requirements
  useEffect(() => {
    if (activeUser?.username) {
      document.title = `${activeUser.username} | AlgoArena`
    }
  }, [activeUser?.username])

  // 1. Loading Skeleton State
  if ((authLoading && isOwnProfileRoute) || dataLoading) {
    return <ProfileV2Skeleton />
  }

  // 2. Not Found Empty State
  if (notFound) {
    return (
      <div className="profile-v2">
        <div className="profile-v2-container" style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <h1 className="profile-h1" style={{ fontSize: 24 }}>Player not found</h1>
            <p style={{ color: 'var(--sub)', fontSize: 14, margin: 0, fontFamily: 'var(--font-mono)' }}>
              No competitor exists with handle &quot;@{routeUsername}&quot;.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => doNavigate('/lobby')}
                className="btn-action"
                style={{ padding: '8px 16px', background: 'var(--ink)', color: 'var(--bg-0)', fontWeight: 600 }}
              >
                Go to Lobby
              </button>
              <button
                type="button"
                onClick={() => doNavigate('/leaderboard')}
                className="btn-action"
                style={{ padding: '8px 16px' }}
              >
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!activeUser) return null

  const totalMatches = activeUser?.total_matches ?? ((Number(wins) + Number(losses) > 0) ? (Number(wins) + Number(losses)) : matches.length)

  return (
    <div className="profile-v2">
      <div className="profile-v2-container">
        {/* ── LEETCODE 2-COLUMN STRUCTURE (SIDEBAR + MAIN) ─────────────── */}
        <div className="profile-leetcode-layout">
          {/* ── LEFT COLUMN: SIDEBAR ─────────────────────────────────── */}
          <ProfileSidebar
            activeUser={activeUser}
            isMe={isMe}
            elo={elo}
            setShowAvatarModal={setShowAvatarModal}
            setShowEditProfileModal={setShowEditProfileModal}
            editingUsername={editingUsername}
            setEditingUsername={setEditingUsername}
            newHandle={newHandle}
            setNewHandle={setNewHandle}
            handleErr={handleErr}
            savingHandle={savingHandle}
            handleSaveUsername={handleSaveUsername}
            topicFreq={topicFreq}
            matches={matches}
            eloHistory={eloHistory}
          />

          {/* ── RIGHT COLUMN: MAIN CONTENT ───────────────────────────── */}
          <main className="profile-leetcode-main">
            {/* 1. TOP ROW: CONTEST RATING CHART (FULL WIDTH) */}
            <div className="main-col-top-row">
              <RatingChartV2
                data={chartData}
                elo={elo}
                username={activeUser?.username || 'Warrior'}
                isOwnProfile={isMe}
                onNavigateLobby={() => doNavigate('/lobby')}
              />
            </div>

            {/* 2. MID ROW: KEY COMBAT NUMBERS (FULL WIDTH) */}
            <div className="main-col-stats-row">
              <KeyNumbersRow
                totalMatches={totalMatches}
                wins={wins}
                losses={losses}
                wr={wr}
                streak={streak}
                activeDates={activeDates}
                favTopicTitle={favTopicTitle}
                friendsCount={friendsCount}
                username={activeUser?.username}
                friendsHidden={Boolean(!isMe && activeUser?.friends_hidden)}
              />
            </div>

            {/* 4. BIG ANNUAL ACTIVITY HEATMAP */}
            <ActivityHeatmapYear
              matches={matches}
              eloHistory={eloHistory}
              activeDates={activeDates}
              streak={streak}
            />

            {/* 4. MATCH HISTORY TABLE (Recent AC & Filters) */}
            <MatchHistoryV2
              matches={matches}
              onNavigate={doNavigate}
            />

            {/* 5. FOOTNOTE (TRUST NOTICE) */}
            <FootNoteV2 lastUpdated={matches[0]?.ended_at} />
          </main>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────── */}
      {isMe && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          activeUser={activeUser}
          onSaveProfile={handleSaveProfile}
          onOpenAvatarModal={() => setShowAvatarModal(true)}
        />
      )}

      {/* ── AVATAR MODAL ──────────────────────────────────────────── */}
      {isMe && (
        <AvatarModalV2
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentSeed={activeUser?.avatar_seed}
          currentStyle={activeUser?.avatar_style}
          username={activeUser?.username}
          onSave={handleSaveAvatar}
        />
      )}
    </div>
  )
}
