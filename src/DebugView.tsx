import {Canvas, Circle} from '@shopify/react-native-skia';
import {View} from 'react-native';
import {BodyPart} from './types.ts';
import {BodyPartValue} from './useBodyPartValues.ts';

export const DebugView = ({
  canvasSize,
  values,
}: {
  canvasSize: number;
  values: Record<BodyPart, BodyPartValue>;
}) => {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Canvas
        style={{
          width: canvasSize,
          height: canvasSize,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}>
        {Object.entries(values).map(([key, value]) => {
          return (
            <Circle
              opacity={value.confidence}
              key={key}
              cx={value.x}
              cy={value.y}
              r={12}
              color={'blue'}
            />
          );
        })}
      </Canvas>
    </View>
  );
};
