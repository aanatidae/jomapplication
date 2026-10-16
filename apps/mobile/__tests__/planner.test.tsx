import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { PlannerScreen } from '../src/features/planner/PlannerScreen';

function demoControls() { fireEvent.press(screen.getByRole('button', { name: 'Demo controls' })); }
function preview(label: string) { fireEvent.press(screen.getByRole('button', { name: label })); }

it('switches all profiles, prioritizes the selected card and updates map semantics', () => {
  render(<PlannerScreen />);
  for (const [mode, minutes] of [['Safer at Night', 10], ['Step-Free', 12], ['Fastest', 8]] as const) {
    fireEvent.press(within(screen.getByLabelText('Route priority')).getByRole('radio', { name: mode }));
    expect(within(screen.getByLabelText('Route priority')).getByRole('radio', { name: mode, checked: true })).toBeTruthy();
    expect(screen.getByRole('image').props.accessibilityLabel).toContain(`Selected ${mode}, ${minutes} minutes`);
    expect(screen.getByRole('radio', { name: new RegExp(`${mode}, ${minutes} minutes`), checked: true })).toBeTruthy();
  }
  expect(screen.getByText('+2 min vs fastest')).toBeTruthy();
  expect(screen.getByText('+4 min vs fastest')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: /^Step-Free, 12 minutes/ }));
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('Selected Step-Free, 12 minutes');
});

it('selects local places, searches without geocoding, and handles equal endpoints', () => {
  render(<PlannerScreen />);
  preview('To · Community Mall');
  fireEvent.changeText(screen.getByLabelText('Search demo places'), 'Park');
  preview('Park Entrance');
  expect(screen.getByRole('button', { name: 'To · Park Entrance' })).toBeTruthy();
  preview('From · Transit Stop');
  preview('Park Entrance');
  expect(screen.getByText('No route available')).toBeTruthy();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  preview('Retry demo');
  expect(screen.getAllByRole('radio')).toHaveLength(6);
});

it.each([
  ['Loading routes', 'Loading routes'], ['No route results', 'No route available'],
  ['Map unavailable', 'Map unavailable'], ['Permission denied', 'Location permission denied'],
  ['Route data unavailable', 'Route data unavailable'], ['Generic error', 'Something went wrong'],
])('previews %s and recovers', (control, title) => {
  render(<PlannerScreen />); demoControls(); preview(control);
  expect(screen.getByRole('header', { name: title })).toBeTruthy();
  if (['Loading routes', 'No route results', 'Route data unavailable', 'Generic error'].includes(control)) {
    expect(screen.getByRole('image').props.accessibilityLabel).toContain('No route is displayed');
  }
  preview(control === 'Loading routes' ? 'Show demo routes' : control === 'Permission denied' ? 'Use manual origin' : 'Retry demo');
  if (control === 'Permission denied') {
    expect(screen.getByRole('header', { name: 'Choose origin' })).toBeTruthy();
    preview('Park Entrance');
    expect(screen.getByRole('button', { name: 'From · Park Entrance' })).toBeTruthy();
  }
  expect(within(screen.getByLabelText('Route priority')).getByRole('radio', { name: 'Fastest', checked: true })).toBeTruthy();
});

it('never presents unknown step-free attributes as verified', () => {
  render(<PlannerScreen />); demoControls(); preview('Unknown accessibility');
  expect(screen.getAllByText('Unknown: Accessibility unknown')).toHaveLength(3);
  expect(screen.queryByText('Accessible entrance')).toBeNull();
  expect(screen.getByText('Entrance accessibility unknown')).toBeTruthy();
});

it('collapses to the selected card, then expands all three routes', () => {
  render(<PlannerScreen />); preview('Collapse comparison');
  expect(screen.getAllByRole('radio')).toHaveLength(4);
  fireEvent.press(screen.getByRole('radio', { name: 'Step-Free' }));
  expect(screen.getByText('12 min')).toBeTruthy();
  expect(screen.queryByText('8 min')).toBeNull();
  preview('Compare all 3 routes');
  expect(screen.getAllByRole('radio')).toHaveLength(6);
});

it('keeps worst-case place, reason and confidence content readable in the same components', () => {
  render(<PlannerScreen />); demoControls();
  fireEvent(screen.getByRole('switch', { name: 'Worst case data' }), 'valueChange', true);
  expect(screen.getByRole('button', { name: /To · Community Mall — North entrance/ })).toBeTruthy();
  expect(screen.getAllByText('Covered pedestrian connection')).toHaveLength(3);
  expect(screen.getAllByText(/Source: Community submitted — pending independent/)).toHaveLength(3);
  preview('Unknown accessibility');
  expect(screen.getAllByText('Unknown: Accessibility unknown')).toHaveLength(3);
  expect(screen.queryByText('Accessible entrance')).toBeNull();
});
