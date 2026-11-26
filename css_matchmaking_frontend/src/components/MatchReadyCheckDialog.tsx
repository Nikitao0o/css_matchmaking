import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import SportsEsports from '@mui/icons-material/SportsEsports';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReadyCheck, respondReadyCheck, type ReadyCheckData } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { paths } from '@/router/paths';
import { colors } from '@/theme';

const TOTAL_TIMEOUT_SECONDS = 25;
export const QUEUE_UPDATED_EVENT = 'mm:queue-updated';

const MODE_LABELS: Record<string, string> = {
  '1v1': '1х1 Дуэль',
  wingman: '2х2 Напарники',
  '2v2': '2х2 Напарники',
  '5v5': '5х5 Соревновательный',
};

function playMatchFoundSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [587.33, 880]; // D5 -> A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.26);
    });
  } catch {
    // Браузер может блокировать автовоспроизведение звука до клика
  }
}

export default function MatchReadyCheckDialog() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [readyCheck, setReadyCheck] = useState<ReadyCheckData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(TOTAL_TIMEOUT_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handledResolvedIds = useRef<Set<number>>(new Set());
  const chimedIds = useRef<Set<number>>(new Set());
  const readyCheckIdRef = useRef<number | null>(null);

  const handleReadyCheckPayload = useCallback(
    async (rc: ReadyCheckData | null) => {
      if (!rc) {
        readyCheckIdRef.current = null;
        setReadyCheck(null);
        return;
      }

      if (rc.status === 'pending') {
        if (rc.my_status === 'declined') {
          readyCheckIdRef.current = null;
          setReadyCheck(null);
          return;
        }
        if (!chimedIds.current.has(rc.id)) {
          chimedIds.current.add(rc.id);
          playMatchFoundSound();
        }
        readyCheckIdRef.current = rc.id;
        setReadyCheck(rc);
        setSecondsLeft(rc.seconds_left);
        return;
      }

      if (handledResolvedIds.current.has(rc.id)) {
        return;
      }
      handledResolvedIds.current.add(rc.id);
      readyCheckIdRef.current = null;
      setReadyCheck(null);
      window.dispatchEvent(new Event(QUEUE_UPDATED_EVENT));

      if (rc.status === 'accepted' && rc.room_id !== null) {
        await refreshUser();
        setToast(`Матч подтверждён! Переход в комнату #${rc.room_id}…`);
        navigate(paths.match(rc.room_id));
        return;
      }

      if (rc.status === 'declined' || rc.status === 'expired') {
        if (rc.my_status !== 'accepted') {
          setToast('Вы не приняли матч и были удалены из очереди');
        } else {
          setToast('Один из игроков не принял матч. Поиск продолжается…');
        }
      }
    },
    [navigate, refreshUser],
  );

  const hasPendingReadyCheck = Boolean(readyCheck && readyCheck.status === 'pending');

  useEffect(() => {
    if (!user?.id || user.current_room_id !== null) {
      readyCheckIdRef.current = null;
      return;
    }

    let active = true;
    let inFlight = false;

    const poll = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const res = await getReadyCheck(user.id);
        if (!active) return;
        await handleReadyCheckPayload(res.has_ready_check ? res.ready_check : null);
      } catch (err: unknown) {
        console.warn('[READY CHECK] Ошибка проверки готовности матча:', err);
      } finally {
        inFlight = false;
      }
    };

    const onQueueUpdated = () => {
      void poll();
    };

    void poll();
    const intervalMs = hasPendingReadyCheck ? 1000 : 2500;
    const intervalId = window.setInterval(() => {
      void poll();
    }, intervalMs);

    window.addEventListener(QUEUE_UPDATED_EVENT, onQueueUpdated);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener(QUEUE_UPDATED_EVENT, onQueueUpdated);
    };
  }, [user?.id, user?.current_room_id, hasPendingReadyCheck, handleReadyCheckPayload]);

  // Плавный локальный отсчёт таймера каждую секунду
  useEffect(() => {
    if (!readyCheck || readyCheck.status !== 'pending') return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [readyCheck?.id, readyCheck?.status]);

  const handleRespond = async (accept: boolean) => {
    if (!readyCheck || !user?.id || submitting) return;
    setSubmitting(true);
    try {
      const res = await respondReadyCheck(readyCheck.id, user.id, accept);
      await handleReadyCheckPayload(res.has_ready_check ? res.ready_check : null);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : 'Не удалось отправить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  const open = Boolean(user && user.current_room_id === null && readyCheck && readyCheck.status === 'pending');
  const progress = Math.min(100, Math.max(0, (secondsLeft / TOTAL_TIMEOUT_SECONDS) * 100));

  return (
    <>
      <Dialog
        open={open}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#141418',
              border: `2px solid ${colors.primary}`,
              borderRadius: 2.5,
              boxShadow: '0 0 40px rgba(255, 85, 0, 0.35), 0 18px 50px rgba(0, 0, 0, 0.85)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            '& .MuiLinearProgress-bar': {
              bgcolor: secondsLeft <= 5 ? colors.danger : colors.primary,
              transition: 'width 0.9s linear',
            },
          }}
        />

        <DialogContent sx={{ p: 3.5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2,
              bgcolor: 'rgba(255, 85, 0, 0.14)',
              border: `2px solid ${colors.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
              boxShadow: '0 0 20px rgba(255, 85, 0, 0.35)',
            }}
          >
            <SportsEsports sx={{ fontSize: 30 }} />
          </Box>

          <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.primary, mb: 0.5 }}>
            Матч найден
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', mb: 0.5 }}>
            {MODE_LABELS[readyCheck?.game_mode ?? ''] ?? readyCheck?.game_mode}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2.5 }}>
            Карта: <strong style={{ color: '#FFFFFF' }}>{readyCheck?.map_name}</strong> · Осталось{' '}
            <strong style={{ color: secondsLeft <= 5 ? colors.danger : '#FFFFFF' }}>{secondsLeft} сек</strong>
          </Typography>

          {/* FACEIT-style player acceptance slots */}
          <Stack direction="row" spacing={1.25} sx={{ justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
            {readyCheck?.players.map((p, idx) => {
              const accepted = p.accepted === true;
              const declined = p.accepted === false;
              return (
                <Tooltip key={p.user_id ?? idx} title={p.username ?? `Игрок #${p.user_id}`} arrow>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${accepted ? colors.success : declined ? colors.danger : colors.borderHover}`,
                      bgcolor: accepted
                        ? 'rgba(34, 197, 94, 0.16)'
                        : declined
                          ? 'rgba(239, 68, 68, 0.16)'
                          : 'rgba(255, 255, 255, 0.04)',
                      color: accepted ? colors.success : declined ? colors.danger : colors.textSecondary,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {accepted ? (
                      <Check sx={{ fontSize: 18 }} />
                    ) : declined ? (
                      <Close sx={{ fontSize: 18 }} />
                    ) : (
                      <HourglassEmpty sx={{ fontSize: 16 }} />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>

          <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, mb: 3 }}>
            Приняли: {readyCheck?.accepted_count ?? 0} из {readyCheck?.total_players ?? 0}
          </Typography>

          {readyCheck?.my_status === 'accepted' ? (
            <Box
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1.5,
                bgcolor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                color: colors.success,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Вы приняли матч · Ожидание остальных игроков…
            </Box>
          ) : (
            <Stack spacing={1.25}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                onClick={() => void handleRespond(true)}
                sx={{
                  minHeight: 50,
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 24px rgba(255, 85, 0, 0.45)',
                }}
              >
                {submitting ? 'Подтверждение…' : 'ПРИНЯТЬ МАТЧ'}
              </Button>
              <Button
                variant="text"
                size="small"
                disabled={submitting}
                onClick={() => void handleRespond(false)}
                sx={{ color: colors.textSecondary, '&:hover': { color: colors.danger } }}
              >
                Отклонить
              </Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
}
