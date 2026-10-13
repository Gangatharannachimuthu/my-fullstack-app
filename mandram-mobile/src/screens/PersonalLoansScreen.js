import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Loading, Note, Select, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { memberService, personalLoanService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { font, rupees, spacing } from '../theme';

/**
 * Personal Loans: assign only, exactly like EMI Loans. Repayment and interest are
 * entered in the Member Ledger for the meeting they belong to.
 */
export default function PersonalLoansScreen() {
  const { selectedMeetingId, canEdit, meetingEditable, isAdmin, memberId } = useApp();
  const [form, setForm] = useState({ member_id: '', amount: '' });
  const [filterMember, setFilterMember] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    const [loans, members] = await Promise.all([personalLoanService.getAll(), memberService.getAll()]);
    return { loans: loans.data || [], members: members.data || [] };
  }, [selectedMeetingId]);

  const members = data?.members || [];
  const memberName = (id) => members.find((m) => m.id === id)?.name || `#${id}`;

  const scoped = (data?.loans || []).filter((l) => {
    if (!isAdmin) return memberId ? l.member_id === memberId : false;
    if (filterMember) return String(l.member_id) === String(filterMember);
    return true;
  });

  const outstanding = scoped.filter((l) => l.status === 'outstanding');
  const repaid = scoped.filter((l) => l.status === 'repaid');

  const sum = (rows, field) => rows.reduce((t, l) => t + Number(l[field] || 0), 0);

  const give = async () => {
    if (!form.member_id || !form.amount) return;
    setBusy(true);
    setError('');
    try {
      await personalLoanService.disburse({
        member_id: Number(form.member_id),
        amount: Number(form.amount),
        disbursed_meeting_id: selectedMeetingId,
      });
      setForm({ member_id: '', amount: '' });
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not give the loan'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (loan) =>
    Alert.alert('Remove loan', `Remove ${memberName(loan.member_id)}'s ${rupees(loan.amount)} personal loan?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await personalLoanService.remove(loan.id);
            await reload();
          } catch (err) {
            setError(errorMessage(err, 'Could not remove the loan'));
          }
        },
      },
    ]);

  const LoanCard = ({ loan, showInterest }) => (
    <Card key={loan.id}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={font.h2}>{memberName(loan.member_id)}</Text>
        <Badge text={loan.status} tone={loan.status === 'repaid' ? 'success' : 'warning'} />
      </View>
      <Field label="Amount" value={rupees(loan.amount)} />
      {showInterest ? <Field label="Interest" value={rupees(loan.interest_amount || 0)} /> : null}
      {canEdit ? (
        <Btn title="Remove" tone="danger" onPress={() => confirmDelete(loan)} style={{ marginTop: spacing.md }} />
      ) : null}
    </Card>
  );

  return (
    <Screen meetingScoped refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle
        title="Personal Loans"
        subtitle="Give a loan here. Repayment and interest are entered in the Member Ledger."
      />
      <ErrorBanner message={error} onRetry={reload} />

      {canEdit ? (
        <Card>
          <Select
            label="Give a new personal loan"
            value={form.member_id}
            onChange={(v) => setForm({ ...form, member_id: v })}
            placeholder="Select member"
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <TextField
            value={form.amount}
            onChangeText={(v) => setForm({ ...form, amount: v })}
            placeholder="Amount"
            keyboardType="numeric"
          />
          {!meetingEditable ? <Note>This meeting is finalized — pick an open meeting.</Note> : null}
          <Btn
            title={busy ? 'Giving...' : 'Give loan'}
            onPress={give}
            disabled={busy || !form.member_id || !form.amount || !meetingEditable}
          />
        </Card>
      ) : null}

      {isAdmin ? (
        <Select
          label="Filter by member"
          value={filterMember}
          onChange={setFilterMember}
          placeholder="All members"
          options={[{ value: '', label: 'All members' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
        />
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <>
          <Text style={[font.h2, { marginBottom: spacing.sm }]}>Outstanding</Text>
          {outstanding.length === 0 ? (
            <Empty text="None outstanding." />
          ) : (
            <>
              {outstanding.map((l) => (
                <LoanCard key={l.id} loan={l} />
              ))}
              <Card style={{ backgroundColor: '#eef2ff' }}>
                <Field
                  label={`Total (${outstanding.length})`}
                  value={rupees(sum(outstanding, 'amount'))}
                  valueStyle={{ fontWeight: '700' }}
                />
              </Card>
            </>
          )}

          <Text style={[font.h2, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Repaid</Text>
          {repaid.length === 0 ? (
            <Empty text="None yet." />
          ) : (
            <>
              {repaid.map((l) => (
                <LoanCard key={l.id} loan={l} showInterest />
              ))}
              <Card style={{ backgroundColor: '#eef2ff' }}>
                <Field
                  label={`Total (${repaid.length})`}
                  value={rupees(sum(repaid, 'amount'))}
                  valueStyle={{ fontWeight: '700' }}
                />
                <Field
                  label="Interest earned"
                  value={rupees(sum(repaid, 'interest_amount'))}
                  valueStyle={{ fontWeight: '700' }}
                />
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
