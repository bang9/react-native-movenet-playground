import {useState} from 'react';
import {BodyPart, bodyParts} from './types.ts';
import {makeMutable} from 'react-native-reanimated';
import {Mutable} from 'react-native-reanimated/lib/typescript/commonTypes';

export interface BodyPartValue {
  x: Mutable<number>;
  y: Mutable<number>;
  confidence: Mutable<number>;
}

export const useBodyPartValues = () => {
  const [bodyPartValues] = useState(() => {
    return bodyParts.reduce(
      (acc, cur) => {
        return {
          ...acc,
          [cur]: {
            x: makeMutable(0),
            y: makeMutable(0),
            confidence: makeMutable(0),
          },
        };
      },
      {} as Record<BodyPart, BodyPartValue>,
    );
  });

  return {
    bodyPartValues,
  };
};
