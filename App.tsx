import {
  Camera,
  Orientation,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {useEffect} from 'react';
import {useTensorflowModel} from 'react-native-fast-tflite';
import {useResizePlugin} from 'vision-camera-resize-plugin';
import {DebugView} from './src/DebugView.tsx';
import {useBodyPartValues} from './src/useBodyPartValues.ts';
import {BodyPart, bodyParts} from './src/types.ts';
import {Worklets} from 'react-native-worklets-core';

type Callback = (part: BodyPart, x: number, y: number, score: number) => void;
const events = {
  callback: (() => {}) as Callback,
  listen(callback: Callback) {
    events.callback = callback;
  },
  emit(part: BodyPart, x: number, y: number, score: number) {
    events.callback(part, x, y, score);
  },
};

const emitFromFrame = Worklets.createRunOnJS(
  (part: BodyPart, x: number, y: number, score: number) => {
    events.emit(part, x, y, score);
  },
);

export default function App() {
  const {width, height} = useWindowDimensions();
  const {hasPermission, requestPermission} = useCameraPermission();

  const position = 'front';
  // Center 192x192 crop -> TODO: crop with padding
  const croppedSize = Math.min(width, height);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  const device = useCameraDevice(position);
  const format = useCameraFormat(device, [
    {
      fps: 30,
      videoResolution: {width: 720, height: 1280},
    },
  ]);

  const frameProcessor = useDetectionProcessor();
  const {bodyPartValues} = useBodyPartValues();

  useEffect(() => {
    events.listen((part, _x, y, score) => {
      const isFlipped = position === 'front';
      const x = isFlipped ? 1 - _x : _x;

      bodyPartValues[part].x.value = x * croppedSize;
      bodyPartValues[part].y.value = y * croppedSize;
      bodyPartValues[part].confidence.value = score;
    });
  }, [position, bodyPartValues, croppedSize]);

  if (!hasPermission || !device) return null;
  return (
    <View style={{flex: 1}}>
      <Camera
        resizeMode={'contain'}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        outputOrientation={'device'}
        frameProcessor={frameProcessor}
        pixelFormat={'yuv'}
      />
      <DebugView canvasSize={croppedSize} values={bodyPartValues} />
    </View>
  );
}

function useDetectionProcessor() {
  const {resize} = useResizePlugin();

  const tf = useTensorflowModel(require('./src/movenet_thunder_16.tflite'));
  const model = tf.state === 'loaded' ? tf.model : undefined;

  const modelInput = {
    name: model?.inputs[0]?.name ?? '',
    type: model?.inputs[0]?.dataType ?? 'uint8',
    width: model?.inputs[0]?.shape[1] ?? 0,
    height: model?.inputs[0]?.shape[2] ?? 0,
  };

  return useFrameProcessor(
    frame => {
      'worklet';

      if (model) {
        const data = resize(frame, {
          dataType: modelInput.type as 'uint8',
          pixelFormat: 'rgb',
          rotation: rotateDegree(frame.orientation),
          scale: {
            width: modelInput.width,
            height: modelInput.height,
          },
        });

        const outputs = model.runSync([data]);
        const output = outputs[0];

        for (let i = 0; i < bodyParts.length; i++) {
          const y = output[i * 3] as number;
          const x = output[i * 3 + 1] as number;
          const score = output[i * 3 + 2] as number;
          const part = bodyParts[i];
          emitFromFrame(part, x, y, score);
        }
      }
    },
    [model],
  );
}

function rotateDegree(orientation: Orientation) {
  'worklet';
  switch (orientation) {
    case 'portrait':
      return '0deg';
    case 'landscape-left':
      return '270deg';
    case 'portrait-upside-down':
      return '180deg';
    case 'landscape-right':
      return '90deg';
  }
}
