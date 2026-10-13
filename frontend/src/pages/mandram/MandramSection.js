import React, { useEffect, useState, useCallback } from 'react';
import { meetingService, memberService } from '../../services/mandramApi';
import MandramMeetings from './MandramMeetings';
import MandramMembers from './MandramMembers';
import MandramLoans from './MandramLoans';
import MandramPersonalLoans from './MandramPersonalLoans';
import MandramLedger from './MandramLedger';
import MandramExpenditures from './MandramExpenditures';
import MandramInvestments from './MandramInvestments';
import MandramChits from './MandramChits';
import MandramSummary from './MandramSummary';
import MandramUsers from './MandramUsers';
import '../../styles/Pages.css';
import './Mandram.css';

const TABS = [
  { key: 'meetings', label: 'Meetings' },
  { key: 'members', label: 'Members' },
  { key: 'ledger', label: 'Member Ledger' },
  { key: 'loans', label: 'EMI Loans' },
  { key: 'personal-loans', label: 'Personal Loans' },
  { key: 'expenditures', label: 'Expenditures' },
  { key: 'investments', label: 'Investments' },
  { key: 'chits', label: 'Chit Management' },
  { key: 'summary', label: 'Monthly Summary' },
  { key: 'users', label: 'Users', adminOnly: true },
];

const MEETING_SCOPED_TABS = ['ledger', 'loans', 'personal-loans', 'expenditures', 'investments', 'summary'];

function monthLabel(month, year) {
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[month]} ${year}`;
}

function MandramSection({ canEdit = true, isAdmin = false, memberId = null }) {
  const [activeTab, setActiveTab] = useState('meetings');
  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMeetings = useCallback(async () => {
    const res = await meetingService.getAll();
    const list = res.data || [];
    setMeetings(list);
    setSelectedMeetingId((current) => {
      if (current && list.some((m) => m.id === current)) return current;
      return list.length > 0 ? list[0].id : null;
    });
    return list;
  }, []);

  const refreshMembers = useCallback(async () => {
    const res = await memberService.getAll();
    setMembers(res.data || []);
    return res.data;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshMeetings(), refreshMembers()]);
      setLoading(false);
    })();
  }, [refreshMeetings, refreshMembers]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || null;

  return (
    <div className="page-container">

      <div className="tab-bar">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {MEETING_SCOPED_TABS.includes(activeTab) && (
        <div className="mandram-meeting-picker">
          <label>Meeting (Month/Year):</label>
          <select
            value={selectedMeetingId || ''}
            onChange={(e) => setSelectedMeetingId(Number(e.target.value))}
          >
            {meetings.length === 0 && <option value="">No meetings yet</option>}
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {monthLabel(m.month, m.year)} — {m.status}
              </option>
            ))}
          </select>
          {selectedMeeting && (
            <span className={`badge ${selectedMeeting.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
              {selectedMeeting.status}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {activeTab === 'meetings' && (
            <MandramMeetings meetings={meetings} onChanged={refreshMeetings} canEdit={canEdit} />
          )}
          {activeTab === 'members' && (
            <MandramMembers
              members={members}
              onChanged={refreshMembers}
              canEdit={canEdit}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === 'loans' && (
            <MandramLoans
              members={members}
              meetings={meetings}
              selectedMeetingId={selectedMeetingId}
              canEdit={canEdit}
              isAdmin={isAdmin}
              memberId={memberId}
            />
          )}
          {activeTab === 'personal-loans' && (
            <MandramPersonalLoans
              members={members}
              meetings={meetings}
              selectedMeetingId={selectedMeetingId}
              canEdit={canEdit}
              isAdmin={isAdmin}
              memberId={memberId}
            />
          )}
          {activeTab === 'ledger' && (
            <MandramLedger
              meetingId={selectedMeetingId}
              members={members}
              canEdit={canEdit}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === 'expenditures' && (
            <MandramExpenditures meetingId={selectedMeetingId} canEdit={canEdit} />
          )}
          {activeTab === 'investments' && (
            <MandramInvestments meetingId={selectedMeetingId} canEdit={canEdit} />
          )}
          {activeTab === 'chits' && (
            <MandramChits
              meetings={meetings}
              selectedMeetingId={selectedMeetingId}
              canEdit={canEdit}
            />
          )}
          {activeTab === 'summary' && (
            <MandramSummary meetingId={selectedMeetingId} onFinalized={refreshMeetings} canEdit={canEdit} />
          )}
          {activeTab === 'users' && isAdmin && <MandramUsers members={members} />}
        </>
      )}
    </div>
  );
}

export default MandramSection;
