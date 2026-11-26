import Close from '@mui/icons-material/Close';
import PersonAddAlt from '@mui/icons-material/PersonAddAltOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PlayerAvatar from '@/components/PlayerAvatar';
import { colors } from '@/theme';
import type { Player } from '@/types';
import { fmt } from '@/utils/format';

export interface TeammateSlot {
  userId?: number;
  player?: Player;
  ready?: boolean;
}

interface TeammateCardProps {
  slotIndex: number;
  slot: TeammateSlot;
  onInvite: () => void;
  onRemove: () => void;
  label?: string;
}

export default function TeammateCard({ slotIndex: _idx, slot, onInvite, onRemove, label }: TeammateCardProps) {
  if (slot.player) {
    const { player, ready } = slot;
    return (
      <Box
        sx={{
          position: 'relative',
          bgcolor: colors.panel,
          border: 1,
          borderColor: colors.border,
          borderRadius: 2,
          p: 2.5,
          minHeight: 270,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: '#3F3F46',
          },
        }}
      >
        {label && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 12,
              px: 1,
              py: 0.2,
              borderRadius: '4px',
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              fontSize: 10,
              fontWeight: 800,
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </Box>
        )}
        <Tooltip title="Исключить из пати" arrow>
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: colors.textSecondary,
              '&:hover': { color: colors.danger },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1.5 }}>
          <PlayerAvatar
            initials={player.initials}
            size={64}
            sx={{
              border: `2px solid ${player.level === 10 ? '#EF4444' : colors.primary}`,
              borderRadius: '50%',
              fontSize: 20,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 0.7,
              py: 0.1,
              bgcolor: player.level === 10 ? '#EF4444' : colors.primary,
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 900,
              borderRadius: '999px',
              border: '2px solid #18181B',
              lineHeight: 1.1,
            }}
          >
            LVL {player.level}
          </Box>
        </Box>

        <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', mb: 0.5, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </Typography>
        <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1.5, fontSize: 11 }}>
          {player.countryCode} · {player.country}
        </Typography>

        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            px: 1.25,
            py: 0.3,
            borderRadius: '4px',
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>
            {fmt.format(player.elo)} ELO
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: ready ? colors.success : colors.muted, fontSize: 12, fontWeight: 600 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ready ? colors.success : colors.muted }} />
          <span>{ready ? 'Готов' : 'Не готов'}</span>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      onClick={onInvite}
      sx={{
        bgcolor: '#131317',
        border: '1.5px dashed #2A2A33',
        borderRadius: 2,
        p: 2.5,
        minHeight: 270,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: colors.primary,
          bgcolor: 'rgba(255, 85, 0, 0.04)',
          transform: 'translateY(-2px)',
          '& .plus-circle': {
            bgcolor: colors.primary,
            color: '#FFFFFF',
            transform: 'scale(1.08)',
          },
        },
      }}
    >
      <Box
        className="plus-circle"
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          bgcolor: '#1C1C22',
          border: '1px solid #32323D',
          color: colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          transition: 'all 0.15s ease',
        }}
      >
        <PersonAddAlt sx={{ fontSize: 24 }} />
      </Box>

      <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, mb: 0.5 }}>
        {label ? 'Слот напарника' : 'Свободный слот'}
      </Typography>
      <Typography variant="caption" sx={{ color: colors.muted, fontSize: 11 }}>
        Нажмите, чтобы позвать
      </Typography>
    </Box>
  );
}
