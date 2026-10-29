import Visibility from '@mui/icons-material/VisibilityOutlined';
import VisibilityOff from '@mui/icons-material/VisibilityOffOutlined';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { useId, useState, type ChangeEvent } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  autoFocus?: boolean;
}

/** Label-on-top input. `type="password"` gets a show/hide toggle. */
export default function Field({ label, value, onChange, placeholder, helperText, error, type = 'text', autoComplete, autoFocus }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <FormControl fullWidth error={Boolean(error)} sx={{ mb: 2.5 }}>
      <Typography component="label" htmlFor={id} sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
        {label}
      </Typography>
      <OutlinedInput
        id={id}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        type={isPassword && visible ? 'text' : type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        endAdornment={
          isPassword ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                aria-label={visible ? 'Hide password' : 'Show password'}
                onClick={() => setVisible((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                sx={{ color: 'text.disabled' }}
              >
                {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
      />
      {(error || helperText) && (
        <FormHelperText sx={{ mx: 0, mt: 0.75, fontSize: 12 }}>{error ?? helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
