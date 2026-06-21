import { View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './app-text';
import { Icon } from './icon';
import { Button } from './button';

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.xl,
          backgroundColor: colors.youSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={icon} size={32} color={colors.you} />
      </View>
      <AppText variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.md, alignSelf: 'stretch' }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
