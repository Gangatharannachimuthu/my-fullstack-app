import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Btn, Card, Empty, ErrorBanner, Field, Loading, SectionTitle } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { meetingService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, font, rupees, spacing } from '../theme';

/** Roll-forward lines read better with the sign shown, as they do on the web. */
function Signed({ label, value, sign }) {
  const prefix = sign === '-' ? '− ' : sign === '+' ? '+ ' : '';
  return <Field label={`${prefix}${label}`} value={rupees(value)} />;
}

export default function SummaryScreen() {
  const { selectedMeetingId, selectedMeeting, canEdit, refreshMeetings } = useApp();
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(
    async () => (selectedMeetingId ? (await meetingService.getSummary(selectedMeetingId)).data : null),
    [selectedMeetingId]
  );

  const finalize = () => {
    Alert.alert(
      'Finalize month',
      'This locks every entry for this meeting and freezes its closing balance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            setBusy(true);
            try {
              await meetingService.finalize(selectedMeetingId);
              await Promise.all([reload(), refreshMeetings()]);
            } catch (err) {
              setError(errorMessage(err, 'Could not finalize'));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  if (!selectedMeetingId) {
    return (
      <Screen meetingScoped>
        <Empty text="Pick a meeting to see its summary." />
      </Screen>
    );
  }

  const isFinalized = selectedMeeting?.status === 'finalized';

  return (
    <Screen meetingScoped refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle title="Monthly Summary" />
      <ErrorBanner message={error} onRetry={reload} />

      {loading ? (
        <Loading />
      ) : !data ? (
        <Empty text="No summary for this meeting." />
      ) : (
        <>
          <Card>
            <SectionTitle>Income (வரவு)</SectionTitle>
            <Field label="Share contributions" value={rupees(data.income.share_income)} />
            <Field label="EMI loan interest" value={rupees(data.income.emi_loan_interest)} />
            <Field label="Personal loan interest" value={rupees(data.income.personal_loan_interest)} />
            <Field label="Penalties" value={rupees(data.income.penalty_income)} />
            <Field label="Other income" value={rupees(data.income.other_income)} />
            <Field label="Chit commission" value={rupees(data.total_investment_commission)} />
            <Field label="Joining contributions" value={rupees(data.income.joining_collected)} />
            <View style={s.total}>
              <Field
                label="Total income"
                value={rupees(data.income.total_income)}
                valueStyle={{ fontWeight: '700' }}
              />
            </View>
          </Card>

          <Card>
            <SectionTitle>Expenditure (செலவு)</SectionTitle>
            <Field label="Total expenditure" value={rupees(data.expenditure.total_expenditure)} />
            <View style={s.total}>
              <Field label="Net income" value={rupees(data.net_income)} valueStyle={{ fontWeight: '700' }} />
            </View>
          </Card>

          <Card>
            <SectionTitle>Balance Roll-Forward</SectionTitle>
            <Field label="Last month balance (opening)" value={rupees(data.opening_balance)} />
            <Signed sign="+" label="This month total income" value={data.income.total_income} />
            <Signed sign="+" label="EMI loan amount collected" value={data.collections.emi_principal_collected} />
            <Signed sign="+" label="Personal loan amount collected" value={data.collections.personal_loan_collected} />
            <Signed sign="-" label="New EMI loans given out" value={data.new_emi_loans_disbursed} />
            <Signed sign="-" label="New personal loans given out" value={data.new_personal_loans_disbursed} />
            <Signed sign="-" label="Total expenditure" value={data.expenditure.total_expenditure} />
            <Signed sign="-" label="Investment / savings" value={data.total_investment_outflow} />
            <Signed sign="+" label="Chit amount taken" value={data.total_chit_taken} />
            <View style={s.total}>
              <Field
                label="Current month total balance"
                value={rupees(data.closing_balance)}
                valueStyle={{ fontWeight: '700', color: colors.primary }}
              />
            </View>
            <View style={{ height: spacing.sm }} />
            <Field label="Outstanding EMI loans" value={rupees(data.outstanding_emi_loans)} />
            <Field label="Outstanding personal loans" value={rupees(data.outstanding_personal_loans)} />
            <Field label="Investments held" value={rupees(data.investments_held)} />
            <View style={s.total}>
              <Field
                label="Mandram total value"
                value={rupees(data.trust_total_value)}
                valueStyle={{ fontWeight: '700', color: colors.primary }}
              />
            </View>
            <Text style={[font.small, { marginTop: spacing.sm, lineHeight: 17 }]}>
              Total value is everything the mandram owns — cash, money lent out, and money placed
              in chits, gold and deposits.
            </Text>
          </Card>

          {canEdit ? (
            <Btn
              title={isFinalized ? 'Already finalized' : busy ? 'Finalizing...' : 'Finalize month'}
              onPress={finalize}
              disabled={isFinalized || busy}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

const s = {
  total: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
};
