import { useEffect, useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_COLORS } from '@/lib/labelColors';
import { LABEL_PALETTE } from '@/lib/labelPalette';
import { petalOffset } from '@/lib/petalOffset';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';

const FLOWER_SIZE = 148;
const PETAL_SIZE = 26;
const PETAL_RADIUS = 54;
const CENTER_SIZE = 34;

interface ColorPickerProps {
  value: LabelColor;
  label: string;
  colorLabel: (color: LabelColor) => string;
  onChange: (color: LabelColor) => void;
  glyph?: (color: LabelColor) => React.ReactNode;
}

export function ColorPicker({ value, label, colorLabel, onChange, glyph }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const petals = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, LABEL_COLORS.indexOf(value));
  const setColorFlowerOpen = useUIStore((s) => s.setColorFlowerOpen);

  useEffect(() => {
    setColorFlowerOpen(open);
    return () => setColorFlowerOpen(false);
  }, [open, setColorFlowerOpen]);

  function choose(color: LabelColor) {
    onChange(color);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + LABEL_COLORS.length) % LABEL_COLORS.length;
    petals.current[next]?.focus();
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={`${label}: ${colorLabel(value)}`}
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-transform outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:scale-90"
      >
        {glyph ? (
          glyph(value)
        ) : (
          <span
            aria-hidden="true"
            className="h-5 w-5 rounded-full shadow-inner ring-1 ring-black/10"
            style={{ background: LABEL_PALETTE[value] }}
          />
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="center"
          sideOffset={({ anchor, positioner }) => -(anchor.height / 2 + positioner.height / 2)}
          collisionPadding={8}
          className="z-[70]"
        >
          <Popover.Popup
            initialFocus={() => petals.current[selectedIndex] ?? null}
            className="relative rounded-full bg-popover/95 shadow-2xl ring-1 ring-border backdrop-blur outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-50 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-50 duration-150"
            style={{ width: FLOWER_SIZE, height: FLOWER_SIZE }}
          >
            <div role="radiogroup" aria-label={label} className="absolute inset-0">
              {LABEL_COLORS.map((color, index) => {
                const { x, y } = petalOffset(index, LABEL_COLORS.length, PETAL_RADIUS);
                const selected = color === value;
                return (
                  <motion.button
                    key={color}
                    ref={(element) => {
                      petals.current[index] = element;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={colorLabel(color)}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => choose(color)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    initial={reduceMotion ? false : { x: 0, y: 0, scale: 0.2, opacity: 0 }}
                    animate={{ x, y, scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.18 }}
                    whileTap={{ scale: 0.9 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 460, damping: 24, delay: index * 0.018 }
                    }
                    className={cn(
                      'absolute top-1/2 left-1/2 flex items-center justify-center rounded-full shadow-md outline-none focus-visible:ring-3 focus-visible:ring-ring/60',
                      selected && 'ring-2 ring-foreground/60 ring-offset-2 ring-offset-popover',
                    )}
                    style={{
                      width: PETAL_SIZE,
                      height: PETAL_SIZE,
                      marginLeft: -PETAL_SIZE / 2,
                      marginTop: -PETAL_SIZE / 2,
                      background: LABEL_PALETTE[color],
                    }}
                  >
                    {selected && (
                      <Check
                        className="h-3.5 w-3.5 text-white [filter:drop-shadow(0_0_1px_rgb(0_0_0/0.7))]"
                        aria-hidden="true"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <Popover.Close
              aria-label={colorLabel(value)}
              className="absolute top-1/2 left-1/2 rounded-full shadow-inner ring-4 ring-popover outline-none focus-visible:ring-ring/60"
              style={{
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                marginLeft: -CENTER_SIZE / 2,
                marginTop: -CENTER_SIZE / 2,
                background: LABEL_PALETTE[value],
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
