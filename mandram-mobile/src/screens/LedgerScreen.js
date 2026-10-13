import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Loading, Note, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { joiningService, loanService, meetingService, penaltyService, personalLoanService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, font, rupees, spacing } from '../theme';

/**
 * The Sheet-1 equivalent. On the web this is one wide table; on a phone each
 * member becomes a card with their share, joining installment, EMI loans,
 * personal loans and penalties stacked inside it.
 *
 * Entry happens here for everything that recurs monthly. Giving out a loan is not
 * here by design - that belongs on the loan tabs, the same split the web app uses.
 */
export default function LedgerScreen() {
  const { selectedMeetingId, meetingEditable, canEdit } = useApp();
  const [busyKey, setBusyKey] = useState(null);
  const [inputs, setInputs] = useState({});

  const editable = canEdit && meetingEditable;

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    if (!selectedMeetingId) return null;
    const [ledger, dues, paid] = await Promise.all([
      meetingService.getLedger(selectedMeetingId),
      joiningService.getDues(),
      joiningService.getForMeeting(selectedMeetingId),
    ]);
    return {
      rows: ledger.data.rows || [],
      meeting: ledger.data.meeting,
      dues: dues.data || [],
      paid: Object.fromEntries((paid.data || []).map((p) => [p.member_id, p.amount])),
    };
  }, [selectedMeetingId]);

  const setInput = (key, value) => setInputs((prev) => ({ ...prev, [key]: value }));

  const act = async (key, fn, failMessage) => {
    setBusyKey(key);
    setError('');
    try {
      await fn();
      setInputs({});
      await reload();
    } catch (err) {
      setError(errorMessage(err, failMessage));
    } finally {
      setBusyKey(null);
    }
  };

  const confirm = (title, message, onYes) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onYes },
    ]);

  if (!selectedMeetingId) {
    return (
      <Screen meetingScoped>
        <Empty text="Pick a meeting to open its ledger." />
      </Screen>
    );
  }

  const rows = data?.rows || [];
  const dueFor = (memberId) => (data?.dues || []).find((d) => d.member_id === memberId) || null;

  return (
    <Screen meetingScoped refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle title="Member Ledger" />
      <ErrorBanner message={error} onRetry={reload} />
      {!meetingEditable && data ? (
        <Note>This meeting is finalized, so everything in it is read-only.</Note>
      ) : null}

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty text="No members in this meeting." />
      ) : (
        rows.map((row) => {
          const due = dueFor(row.member_id);
          const paidThisMonth = data.paid[row.member_id];
          return (
            <Card key={row.member_id}>
              <Text style={[font.h2, { marginBottom: spacing.sm }]}>{row.member_name}</Text>

              {/* Share contribution */}
              <Field label="Share amount" value={row.share_amount != null ? rupees(row.share_amount) : '-'} />
              {editable ? (
                <View style={s.entryRow}>
                  <TextField
                    style={{ flex: 1, marginBottom: 0 }}
                    value={inputs[`share-${row.member_id}`] ?? ''}
                    onChangeText={(v) => setInput(`share-${row.member_id}`, v)}
                    placeholder={row.share_amount != null ? String(row.share_amount) : '1000'}
                    keyboardType="numeric"
                  />
                  <Btn
                    title="Save"
                    onPress={() =>
                      act(
                        `share-${row.member_id}`,
                        () =>
                          meetingService.upsertShareContribution(selectedMeetingId, {
                            member_id: row.member_id,
                            amount: Number(inputs[`share-${row.member_id}`]),
                          }),
                        'Could not save the share amount'
                      )
                    }
                    disabled={!inputs[`share-${row.member_id}`] || busyKey === `share-${row.member_id}`}
                  />
                </View>
              ) : null}

              {/* Joining contribution - only for members who owe one */}
              {due ? (
                <View style={s.block}>
                  <View style={s.blockHead}>
                    <Text style={font.label}>Joining contribution</Text>
                    <Badge
                      text={
                        due.is_cleared
                          ? 'fully paid'
                          : `${rupees(due.remaining)} left of ${rupees(due.total_amount)}`
                      }
                      tone={due.is_cleared ? 'success' : 'warning'}
                    />
                  </View>
                  <Field label="Paid this month" value={paidThisMonth != null ? rupees(paidThisMonth) : '-'} />
                  {editable ? (
                    <View style={s.entryRow}>
                      <TextField
                        style={{ flex: 1, marginBottom: 0 }}
                        value={inputs[`join-${row.member_id}`] ?? ''}
                        onChangeText={(v) => setInput(`join-${row.member_id}`, v)}
                        placeholder={paidThisMonth != null ? String(paidThisMonth) : '0'}
                        keyboardType="numeric"
                      />
                      <Btn
                        title="Save"
                        onPress={() =>
                          act(
                            `join-${row.member_id}`,
                            () =>
                              joiningService.pay(selectedMeetingId, {
                                member_id: row.member_id,
                                amount: Number(inputs[`join-${row.member_id}`]),
                              }),
                            'Could not save the joining payment'
                          )
                        }
                        disabled={!inputs[`join-${row.member_id}`] || busyKey === `join-${row.member_id}`}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* EMI loans - a member can hold several at once */}
              <View style={s.block}>
                <Text style={font.label}>EMI loans</Text>
                {row.emi_loans.length === 0 ? (
                  <Text style={s.none}>No active loan</Text>
                ) : (
                  row.emi_loans.map((loan) => (
                    <View key={loan.loan_id} style={s.sub}>
                      {loan.just_given ? (
                        <>
                          <Field label="Given this month" value={rupees(loan.principal_amount)} />
                          <Text style={s.none}>First payment due next meeting.</Text>
                        </>
                      ) : (
                        <>
                          <Field label="Installment" value={loan.installment_paid != null ? rupees(loan.installment_paid) : '-'} />
                          <Field label="Interest" value={loan.interest_paid != null ? rupees(loan.interest_paid) : '-'} />
                          <Field label="Balance" value={rupees(loan.outstanding_balance)} />
                          {loan.closed_this_month ? <Badge text="Loan closed this month" tone="success" /> : null}
                          {editable ? (
                            <>
                              <View style={s.entryRow}>
                                <TextField
                                  style={{ flex: 1, marginBottom: 0 }}
                                  value={inputs[`emi-i-${loan.loan_id}`] ?? ''}
                                  onChangeText={(v) => setInput(`emi-i-${loan.loan_id}`, v)}
                                  placeholder="Installment"
                                  keyboardType="numeric"
                                />
                                <TextField
                                  style={{ flex: 1, marginBottom: 0 }}
                                  value={inputs[`emi-n-${loan.loan_id}`] ?? ''}
                                  onChangeText={(v) => setInput(`emi-n-${loan.loan_id}`, v)}
                                  placeholder="Interest"
                                  keyboardType="numeric"
                                />
                              </View>
                              <Btn
                                title={loan.installment_paid != null ? 'Update payment' : 'Record payment'}
                                onPress={() =>
                                  act(
                                    `emi-${loan.loan_id}`,
                                    () => {
                                      const payload = {
                                        installment_paid: Number(inputs[`emi-i-${loan.loan_id}`] || 0),
                                        interest_paid: Number(inputs[`emi-n-${loan.loan_id}`] || 0),
                                      };
                                      return loan.installment_paid != null
                                        ? loanService.updatePayment(loan.loan_id, selectedMeetingId, payload)
                                        : loanService.recordPayment(loan.loan_id, {
                                            meeting_id: selectedMeetingId,
                                            ...payload,
                                          });
                                    },
                                    'Could not record the EMI payment'
                                  )
                                }
                                disabled={busyKey === `emi-${loan.loan_id}`}
                                style={{ marginTop: spacing.sm }}
                              />
                              {loan.installment_paid != null ? (
                                <Btn
                                  title="Remove payment"
                                  tone="ghost"
                                  onPress={() =>
                                    confirm('Remove payment', 'Remove this EMI payment?', () =>
                                      act(
                                        `emi-del-${loan.loan_id}`,
                                        () => loanService.removePayment(loan.loan_id, selectedMeetingId),
                                        'Could not remove the payment'
                                      )
                                    )
                                  }
                                  style={{ marginTop: spacing.xs }}
                                />
                              ) : null}
                            </>
                          ) : null}
                        </>
                      )}
                    </View>
                  ))
                )}
              </View>

              {/* Personal loans - repaid / given / pending can apply together */}
              <View style={s.block}>
                <Text style={font.label}>Personal loan</Text>
                <PersonalLoanBlocks
                  row={row}
                  editable={editable}
                  inputs={inputs}
                  setInput={setInput}
                  busyKey={busyKey}
                  act={act}
                  confirm={confirm}
                  meetingId={selectedMeetingId}
                />
              </View>

              {/* Penalties */}
              <View style={s.block}>
                <Text style={font.label}>Penalties</Text>
                {row.penalties.length === 0 ? (
                  <Text style={s.none}>None</Text>
                ) : (
                  row.penalties.map((p) => (
                    <View key={p.id} style={s.sub}>
                      <Field label={p.reason} value={rupees(p.amount)} />
                      {editable ? (
                        <Btn
                          title="Remove"
                          tone="ghost"
                          onPress={() =>
                            confirm('Remove penalty', `Remove the ${rupees(p.amount)} penalty?`, () =>
                              act(`pen-${p.id}`, () => penaltyService.remove(p.id), 'Could not remove the penalty')
                            )
                          }
                          style={{ marginTop: spacing.xs }}
                        />
                      ) : null}
                    </View>
                  ))
                )}
                {editable ? (
                  <>
                    <View style={s.entryRow}>
                      <TextField
                        style={{ flex: 1, marginBottom: 0 }}
                        value={inputs[`pen-a-${row.member_id}`] ?? ''}
                        onChangeText={(v) => setInput(`pen-a-${row.member_id}`, v)}
                        placeholder="Amount"
                        keyboardType="numeric"
                      />
                      <TextField
                        style={{ flex: 2, marginBottom: 0 }}
                        value={inputs[`pen-r-${row.member_id}`] ?? ''}
                        onChangeText={(v) => setInput(`pen-r-${row.member_id}`, v)}
                        placeholder="Reason"
                      />
                    </View>
                    <Btn
                      title="Add penalty"
                      tone="ghost"
                      onPress={() =>
                        act(
                          `pen-new-${row.member_id}`,
                          () =>
                            penaltyService.create({
                              member_id: row.member_id,
                              meeting_id: selectedMeetingId,
                              amount: Number(inputs[`pen-a-${row.member_id}`]),
                              reason: inputs[`pen-r-${row.member_id}`] || 'Penalty',
                            }),
                          'Could not add the penalty'
                        )
                      }
                      disabled={!inputs[`pen-a-${row.member_id}`] || busyKey === `pen-new-${row.member_id}`}
                      style={{ marginTop: spacing.sm }}
                    />
                  </>
                ) : null}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

/**
 * A member can clear one personal loan and take another in the same meeting, so
 * this renders every state that applies rather than only the first match.
 */
function PersonalLoanBlocks({ row, editable, inputs, setInput, busyKey, act, confirm, meetingId }) {
  const blocks = [];
  if (row.personal_loan_repaid) blocks.push({ kind: 'repaid', loan: row.personal_loan_repaid });
  if (row.personal_loan_new) blocks.push({ kind: 'new', loan: row.personal_loan_new });
  if (row.personal_loan_pending) blocks.push({ kind: 'pending', loan: row.personal_loan_pending });

  if (blocks.length === 0) return <Text style={s.none}>No personal loan</Text>;

  return blocks.map(({ kind, loan }) => (
    <View key={loan.personal_loan_id} style={s.sub}>
      {kind === 'repaid' ? (
        <>
          <Field label="Repaid" value={rupees(loan.amount)} />
          <Field label="Interest" value={rupees(loan.interest_amount || 0)} />
          <Badge text="Loan closed this month" tone="success" />
        </>
      ) : kind === 'new' ? (
        <>
          <Field label="Given this month" value={rupees(loan.amount)} />
          <Text style={s.none}>Due next meeting.</Text>
        </>
      ) : (
        <>
          <Field label="Pending (from earlier month)" value={rupees(loan.amount)} />
          {editable ? (
            <>
              <View style={s.entryRow}>
                <TextField
                  style={{ flex: 1, marginBottom: 0 }}
                  value={inputs[`pl-${loan.personal_loan_id}`] ?? ''}
                  onChangeText={(v) => setInput(`pl-${loan.personal_loan_id}`, v)}
                  placeholder="Interest"
                  keyboardType="numeric"
                />
                <Btn
                  title="Mark repaid"
                  onPress={() =>
                    act(
                      `pl-${loan.personal_loan_id}`,
                      () =>
                        personalLoanService.repay(loan.personal_loan_id, {
                          meeting_id: meetingId,
                          interest_amount: Number(inputs[`pl-${loan.personal_loan_id}`] || 0),
                        }),
                      'Could not record the repayment'
                    )
                  }
                  disabled={busyKey === `pl-${loan.personal_loan_id}`}
                />
              </View>
            </>
          ) : null}
        </>
      )}
      {editable ? (
        <Btn
          title="Remove loan"
          tone="ghost"
          onPress={() =>
            confirm('Remove personal loan', 'Remove this loan entirely (disbursement and repayment)?', () =>
              act(
                `pl-del-${loan.personal_loan_id}`,
                () => personalLoanService.remove(loan.personal_loan_id),
                'Could not remove the loan'
              )
            )
          }
          style={{ marginTop: spacing.xs }}
        />
      ) : null}
    </View>
  ));
}

const s = {
  entryRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end', marginTop: spacing.sm },
  block: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  sub: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  none: { ...font.small, color: colors.textFaint, marginTop: 4 },
};
