// import path from 'path';
import { Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import axios from 'axios';
// import { Canvas, loadImage } from 'canvas';

const options = {
  debug: true,
  modelPath: 'file://src/models/nudity/model.json',
  minScore: 0.38,
  maxResults: 50,
  iouThreshold: 0.5,
  outputNodes: ['output1', 'output2', 'output3'],
  labels: undefined,
  classes: {
    base: [
      'exposed belly',
      'exposed buttocks',
      'exposed breasts',
      'exposed vagina',
      'exposed penis',
      'male breast',
    ],
  },
  composites: {
    base: {
      person: [],
      sexy: [],
      nude: [2, 3, 4],
    },
  },
};

const models = {};

// Load and prepare image as tensor
async function getTensorFromImage(imageUrl: string) {
  // if (!fs.existsSync(imageFile)) {
  //   Logger.error('File not found:', imageFile);
  //   return null;
  // }
  const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const bufferT = tf.node.decodeImage(data, 3);
  const expandedT = tf.expandDims(bufferT, 0);
  const imageT = tf.cast(expandedT, 'float32');
  imageT['file'] = imageUrl;
  tf.dispose([expandedT, bufferT]);
  if (options.debug) Logger.log('Loaded image:', imageT['file']);
  return imageT;
}

// Process prediction results
async function processPrediction(
  boxesTensor,
  scoresTensor,
  classesTensor,
  inputTensor,
) {
  const boxes = await boxesTensor.array();
  const scores = await scoresTensor.data();
  const classes = await classesTensor.data();
  const nmsT = await tf.image.nonMaxSuppressionAsync(
    boxes[0],
    scores,
    options.maxResults,
    options.iouThreshold,
    options.minScore,
  );
  const nms = await nmsT.data();
  tf.dispose(nmsT);

  const parts = [];
  for (const i of nms) {
    const id = classes[i];
    parts.push({
      score: scores[i],
      id,
      class: options.labels[id], // lookup class name
    });
  }
  console.log(parts);

  return {
    nude: parts.some((p) => options.composites.base.nude.includes(p.id)),
  };
}

// Load model and run detection
export async function checkNudity(imagePath: string) {
  try {
    models[options.modelPath] = await tf.loadGraphModel(options.modelPath);
    options.labels = options.classes.base;
    if (options.debug) Logger.log('Loaded model:', options.modelPath);
  } catch (err) {
    Logger.error('Error loading model:', err);
    return null;
  }

  const tensor = await getTensorFromImage(imagePath);
  if (!tensor) return false;

  const [boxes, scores, classes] = await models[options.modelPath].executeAsync(
    tensor,
    options.outputNodes,
  );
  console.log({ boxes, scores, classes });
  const result = await processPrediction(boxes, scores, classes, tensor);

  tf.dispose([tensor, boxes, scores, classes]); // Free memory

  return result.nude; // Return true if nudity is detected
}
