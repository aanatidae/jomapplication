import { fireEvent, render, screen } from '@testing-library/react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { LocalPhoto, PhotoPreview } from '../src/components/LocalPhoto';
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const picker = launchImageLibraryAsync as jest.Mock;
beforeEach(() => picker.mockReset());
it('cancelled picker keeps existing photo and denial offers recovery', async () => {
  const onChange = jest.fn(); picker.mockResolvedValueOnce({ canceled: true, assets: null });
  render(<LocalPhoto onChange={onChange}/>); fireEvent.press(screen.getByText('Choose photo'));
  await screen.findByText('Choose photo'); expect(onChange).not.toHaveBeenCalled();
  picker.mockRejectedValueOnce(new Error('permission denied')); fireEvent.press(screen.getByText('Choose photo'));
  await screen.findByText('Photos could not be opened. Check photo access in device settings, retry, or continue without a photo.');
});
it('accepts an image URI and rejects video and oversized images', async () => {
  const onChange = jest.fn(); picker.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileSize: 1024 }] });
  render(<LocalPhoto onChange={onChange}/>); fireEvent.press(screen.getByText('Choose photo'));
  await screen.findByText('Choose photo'); expect(onChange).toHaveBeenCalledWith('file:///photo.jpg');
  picker.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///movie.mp4', mimeType: 'video/mp4' }] });
  fireEvent.press(screen.getByText('Choose photo')); await screen.findByText('Choose an image smaller than 10 MB.');
});
it('broken local photo has a readable fallback', () => {
  render(<PhotoPreview uri="file:///missing.jpg"/>);
  fireEvent(screen.getByLabelText('Attached local photo'), 'error');
  expect(screen.getByText('Photo unavailable on this device.')).toBeTruthy();
});
