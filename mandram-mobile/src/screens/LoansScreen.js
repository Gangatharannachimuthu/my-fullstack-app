import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Loading, Note, Select, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { loanService, memberService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, font, rupees, spacing } from '../theme';

/**
 * EMI Loans: assign a loan to a member. Installments and interest are entered in
 * the Member Ledger, month by month - the same split the web app uses.
 */
export default function LoansScreen() {
  const { selectedMeetingId, canEdit, meetingEditable, isAdmin, memberId } = useApp();
  const [form, setForm] = useState({ member_id: '', principal: '' });
  const [filterMember, setFilterMember] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    const [loans, members] = await Promise.all([loanService.getAll(), memberService.getAll()]);
    return { loans: loans.data || [], members: members.data || [] };
  }, [selectedMeetingId]);

  const members = data?.members || [];
  const memberName = (id) => members.find((m) => m.id === id)?.name || `#${id}`;

  // A viewer only ever sees their own loans; an admin can filter.
  const scoped = (data?.loans || []).filter((l) => {
    if (!isAdmin) return memberId ? l.member_id === memberId : false;
    if (filterMember) return String(l.member_id) === String(filterMember);
    return true;
  });

  const totalPrincipal = scoped.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);
  const totalOutstanding = scoped.reduce((sum, l) => sum + Number(l.current_outstanding_balance || 0), 0);

  const give = async () => {
    if (!form.member_id || !form.principal) return;
    setBusy(true);
    setError('');
    try {
      await loanService.create({
        member_id: Number(form.member_id),
        principal_amount: Number(form.principal),
        start_meeting_id: selectedMeetingId,
      });
      setForm({ member_id: '', principal: '' });
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not open the loan'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (loan) =>
    Alert.alert('Remove loan', `Remove ${memberName(loan.member_id)}'s ${rupees(loan.principal_amount)} loan?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await loanService.remove(loan.id);
            await reload();
          } catch (err) {
            setError(errorMessage(err, 'Could not remove the loan'));
          }
        },
      },
    ]);

  return (
    <Screen meetingScoped refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle
        title="EMI Loans"
        subtitle="Give a loan here. Monthly installments and interest are entered in the Member Ledger."
      />
      <ErrorBanner message={error} onRetry={reload} />

      {canEdit ? (
        <Card>
          <Select
            label="Give a new loan"
            value={form.member_id}
            onChange={(v) => setForm({ ...form, member_id: v })}
            placeholder="Select member"
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <TextField
            value={form.principal}
            onChangeText={(v) => setForm({ ...form, principal: v })}
            placeholder="Principal amount"
            keyboardType="numeric"
          />
          {!meetingEditable ? (
            <Note>This meeting is finalized — pick an open meeting to give a loan.</Note>
          ) : null}
          <Btn
            title={busy ? 'Opening...' : 'Give loan'}
            onPress={give}
            disabled={busy || !form.member_id || !form.principal || !meetingEditable}
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
      ) : scoped.length === 0 ? (
        <Empty text="No loans to show." />
      ) : (
        <>
          {scoped.map((loan) => (
            <Card key={loan.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={font.h2}>{memberName(loan.member_id)}</Text>
                <Badge text={loan.status} tone={loan.status === 'closed' ? 'success' : 'warning'} />
              </View>
              <Field label="Principal" value={rupees(loan.principal_amount)} />
              <Field label="Outstanding" value={rupees(loan.current_outstanding_balance)} />
              {canEdit ? (
                <Btn title="Remove" tone="danger" onPress={() => confirmDelete(loan)} style={{ marginTop: spacing.md }} />
              ) : null}
            </Card>
          ))}

          <Card style={{ backgroundColor: '#eef2ff' }}>
            <Field label={`Total (${scoped.length} loans)`} value="" />
            <Field label="Principal" value={rupees(totalPrincipal)} valueStyle={{ fontWeight: '700' }} />
            <Field label="Outstanding" value={rupees(totalOutstanding)} valueStyle={{ fontWeight: '700' }} />
            <Text style={[font.small, { marginTop: spacing.sm, lineHeight: 17 }]}>
              Outstanding here is each loan&apos;s balance today. The Monthly Summary shows the
              balance as it stood in that month, so the two will differ.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
