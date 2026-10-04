import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius, shadows } from './theme';

export const productDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.md + 1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },

  // Imagen e información
  imageBox: {
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadows.card,
  },
  brand: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ratingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  price: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  stockPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  stockAvailable: {
    backgroundColor: '#DCFCE7',
  },
  stockLow: {
    backgroundColor: '#FEF3C7',
  },
  stockOut: {
    backgroundColor: '#FEE2E2',
  },
  stockText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: 8,
  },
  specItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  specLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  specValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    marginTop: spacing.md,
    ...shadows.button,
  },
  addBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSize.md,
  },

  // Reseñas
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  commentInputError: {
    borderColor: colors.error,
  },
  counter: {
    fontSize: 11,
    color: colors.placeholder,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  reviewItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewAuthor: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.placeholder,
  },
  reviewComment: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  reviewActionText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
  },
  emptyReviews: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: 12,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.primary,
    lineHeight: 18,
  },
});
