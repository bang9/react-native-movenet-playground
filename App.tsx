import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import {StyleSheet} from 'react-native';
import {useEffect} from 'react';

export default function App() {
  const {hasPermission, requestPermission} = useCameraPermission();
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  const device = useCameraDevice('front');

  const format = useCameraFormat(device, [
    {
      videoResolution: {width: 720, height: 1280},
    },
  ]);

  if (!hasPermission || !device) return null;

  console.log('video size:', format?.videoWidth, 'x', format?.videoHeight);

  return (
    <Camera
      resizeMode={'contain'}
      style={StyleSheet.absoluteFill}
      device={device}
      format={format}
      isActive={true}
      outputOrientation={'preview'}
    />
  );
}
