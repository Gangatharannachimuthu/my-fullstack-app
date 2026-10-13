import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, saveUser, setServerUrl as persistServer, setUsername } from '../api/client';
import { meetingService } from '../api/services';

const AppContext = createContext(null);

/**
 * Holds the three things nearly every screen needs: which server to talk to, who
 * is signed in, and which meeting is selected.
 *
 * The meeting list lives here rather than in each screen because almost every tab
 * is scoped to a meeting, and refetching it per screen would mean a slow round
 * trip on every navigation - noticeable on a phone in a way it is not on a LAN
 * desktop.
 */
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [serverUrl, setServerUrlState] = useState(null);
  const [user, setUser] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [meetingsError, setMeetingsError] = useState('');

  useEffect(() => {
    (async () => {
      const session = await loadSession();
      setServerUrlState(session.serverUrl);
      setUser(session.user);
      setReady(true);
    })();
  }, []);

  const refreshMeetings = useCallback(async () => {
    try {
      const res = await meetingService.getAll();
      const list = res.data || [];
      setMeetings(list);
      setMeetingsError('');
      setSelectedMeetingId((current) => {
        if (current && list.some((m) => m.id === current)) return current;
        return list.length ? list[0].id : null;
      });
      return list;
    } catch (err) {
      setMeetingsError('Could not load meetings');
      return [];
    }
  }, []);

  // Only once signed in - an unauthenticated fetch would just fail noisily.
  useEffect(() => {
    if (user && serverUrl) refreshMeetings();
  }, [user, serverUrl, refreshMeetings]);

  const saveServer = useCallback(async (raw) => {
    const url = await persistServer(raw);
    setServerUrlState(url);
    return url;
  }, []);

  const signIn = useCallback(async (nextUser) => {
    setUsername(nextUser.username);
    await saveUser(nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await saveUser(null);
    setUser(null);
    setMeetings([]);
    setSelectedMeetingId(null);
  }, []);

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === selectedMeetingId) || null,
    [meetings, selectedMeetingId]
  );

  const value = {
    ready,
    serverUrl,
    saveServer,
    user,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
    canEdit: user?.role === 'admin',
    memberId: user?.member_id ?? null,
    meetings,
    meetingsError,
    refreshMeetings,
    selectedMeetingId,
    setSelectedMeetingId,
    selectedMeeting,
    // A finalized meeting is read-only everywhere, same rule as the web app.
    meetingEditable: !!selectedMeeting && selectedMeeting.status !== 'finalized',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
