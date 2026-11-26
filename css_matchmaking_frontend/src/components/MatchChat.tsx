import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Panel from '@/components/Panel';
import type { ChatMessage } from '@/types';

const nowHHMM = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function MatchChat({ author }: { author: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, time: nowHHMM(), text: 'Сервер матча запущен. Подключайтесь.' },
  ]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { id: prev.length + 1, time: nowHHMM(), author, text: value }]);
    setText('');
  };

  return (
    <Panel title="Чат матча" caption="Игровой канал">
      <Box sx={{ p: 2 }}>
        <Box sx={{ minHeight: 64, maxHeight: 180, overflowY: 'auto', mb: 2, display: 'grid', rowGap: 1, alignContent: 'start' }} aria-live="polite">
          {messages.map((msg) => (
            <Box key={msg.id} sx={{ display: 'flex', gap: 1.5, fontSize: 13 }}>
              <Box sx={{ color: 'text.disabled', width: 36, flexShrink: 0 }}>{msg.time}</Box>
              {msg.author && <Box sx={{ color: 'primary.main', fontWeight: 600 }}>{msg.author}</Box>}
              <Box sx={{ color: msg.author ? 'text.primary' : 'text.secondary' }}>{msg.text}</Box>
            </Box>
          ))}
          <div ref={endRef} />
        </Box>
        <Box component="form" onSubmit={send} sx={{ display: 'flex', gap: 1 }}>
          <OutlinedInput
            fullWidth
            size="small"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать сообщение игрокам…"
            inputProps={{ 'aria-label': 'Chat message' }}
          />
          <Button type="submit" variant="outlined" sx={{ minWidth: 72 }}>
            Отправить
          </Button>
        </Box>
      </Box>
    </Panel>
  );
}
