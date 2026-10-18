import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, type PressableProps } from 'react-native';
import Animated, { cubicBezier, Easing, FadeInDown } from 'react-native-reanimated';
import { theme } from '../../theme/tokens';

const ReducedMotion = createContext(true);
export function MotionProvider({ children }: { children: ReactNode }) {
  // Default to no movement until the OS preference is known.
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true; let changed = false;
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { changed = true; setReduced(value); });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active && !changed) setReduced(value); }).catch(() => {});
    return () => { active = false; sub.remove(); };
  }, []);
  return <ReducedMotion.Provider value={reduced}>{children}</ReducedMotion.Provider>;
}
export const useMotionReduced = () => useContext(ReducedMotion);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function MotionPressable({ style, children, onPressIn, onPressOut, ...props }: PressableProps) {
  const [pressed, setPressed] = useState(false); const reduced = useMotionReduced();
  return <AnimatedPressable {...props} pressRetentionOffset={16}
    onPressIn={event => { setPressed(true); onPressIn?.(event); }}
    onPressOut={event => { setPressed(false); onPressOut?.(event); }}
    style={[typeof style === 'function' ? style({ pressed }) : style, {
      transform: [{ scale: pressed && !props.disabled && !reduced ? theme.motion.pressScale : 1 }],
      transitionProperty: 'transform', transitionDuration: reduced ? 0 : pressed ? theme.motion.press : theme.motion.release,
      transitionTimingFunction: cubicBezier(...theme.motion.easeOut),
    }]}>{typeof children === 'function' ? children({ pressed }) : children}</AnimatedPressable>;
}
export function StepTransition({ children }: { children: ReactNode }) {
  const reduced = useMotionReduced();
  return <Animated.View style={{ gap: theme.space.md }} entering={reduced ? undefined : FadeInDown.duration(theme.motion.step).easing(Easing.bezier(0.23, 1, 0.32, 1)).withInitialValues({ opacity: 0.8, transform: [{ translateY: 8 }] })}>{children}</Animated.View>;
}
