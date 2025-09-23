import { ShapeKind, ShapeDims, NestingSummary, BoundingBox } from '@/types';
import { calculateBoundingBox } from './geometry/bbox';
import { mmToM2 } from './units';

export interface AdvancedNestingParams {
  shape: ShapeKind;
  dims: ShapeDims;
  quantity: number;
  sheetWidth: string; // mm
  sheetLength: string; // mm - for 2D optimization
  spacing: string; // mm
  kerf: string; // mm
  algorithm: 'simple' | 'bottom_left_fill' | 'best_fit' | 'genetic';
  allowRotation?: boolean;
}

export interface NestingResult extends NestingSummary {
  algorithm_used: string;
  efficiency_percent: string;
  pieces_placed: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: 0 | 90;
  }>;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
}

/**
 * Advanced nesting with multiple optimization algorithms
 */
export function calculateAdvancedNesting(params: AdvancedNestingParams): NestingResult {
  const bbox = calculateBoundingBox(params.shape, params.dims);
  const sheetWidth = parseInt(params.sheetWidth);
  const sheetLength = parseInt(params.sheetLength);
  const spacing = parseFloat(params.spacing);
  const kerf = parseFloat(params.kerf);
  
  const partWidth = parseInt(bbox.width);
  const partHeight = parseInt(bbox.height);
  const effectiveWidth = partWidth + spacing + kerf;
  const effectiveHeight = partHeight + spacing + kerf;
  
  // Early exit if part doesn't fit
  if (effectiveWidth > sheetWidth && effectiveHeight > sheetWidth) {
    return createEmptyResult(params.algorithm, params.sheetWidth);
  }
  
  let result: Rectangle[];
  let algorithmUsed = params.algorithm;
  
  switch (params.algorithm) {
    case 'bottom_left_fill':
      result = bottomLeftFill(effectiveWidth, effectiveHeight, sheetWidth, sheetLength, params.quantity, params.allowRotation);
      break;
    case 'best_fit':
      result = bestFit(effectiveWidth, effectiveHeight, sheetWidth, sheetLength, params.quantity, params.allowRotation);
      break;
    case 'genetic':
      result = geneticAlgorithm(effectiveWidth, effectiveHeight, sheetWidth, sheetLength, params.quantity, params.allowRotation);
      break;
    default:
      // Fallback to simple grid
      return convertSimpleToAdvanced(
        calculateSimpleGrid(partWidth, partHeight, sheetWidth, spacing, kerf, params.quantity),
        'simple'
      );
  }
  
  return createAdvancedResult(result, sheetWidth, sheetLength, algorithmUsed, params.quantity);
}

/**
 * Bottom-Left Fill Algorithm
 * Places pieces from bottom-left, trying to minimize holes
 */
function bottomLeftFill(
  width: number, 
  height: number, 
  sheetWidth: number, 
  sheetLength: number, 
  quantity: number,
  allowRotation = true
): Rectangle[] {
  const placed: Rectangle[] = [];
  const occupiedSpaces: Rectangle[] = [];
  
  for (let i = 0; i < quantity; i++) {
    const position = findBottomLeftPosition(width, height, sheetWidth, sheetLength, occupiedSpaces, allowRotation);
    
    if (!position) break; // No more space
    
    placed.push(position);
    occupiedSpaces.push(position);
  }
  
  return placed;
}

/**
 * Best Fit Algorithm
 * Tries multiple positions and chooses the one that minimizes waste
 */
function bestFit(
  width: number,
  height: number,
  sheetWidth: number,
  sheetLength: number,
  quantity: number,
  allowRotation = true
): Rectangle[] {
  const placed: Rectangle[] = [];
  const occupiedSpaces: Rectangle[] = [];
  
  for (let i = 0; i < quantity; i++) {
    const position = findBestFitPosition(width, height, sheetWidth, sheetLength, occupiedSpaces, allowRotation);
    
    if (!position) break;
    
    placed.push(position);
    occupiedSpaces.push(position);
  }
  
  return placed;
}

/**
 * Genetic Algorithm for optimal nesting
 * Uses evolutionary optimization to find near-optimal placements
 */
function geneticAlgorithm(
  width: number,
  height: number,
  sheetWidth: number,
  sheetLength: number,
  quantity: number,
  allowRotation = true
): Rectangle[] {
  const populationSize = 50;
  const generations = 100;
  const mutationRate = 0.1;
  
  // Initialize random population
  let population = Array.from({ length: populationSize }, () => 
    generateRandomSolution(width, height, sheetWidth, sheetLength, quantity, allowRotation)
  );
  
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for each solution
    const fitnessScores = population.map(solution => evaluateFitness(solution, sheetWidth, sheetLength));
    
    // Select best solutions for breeding
    const selected = selectBest(population, fitnessScores, populationSize / 2);
    
    // Create next generation through crossover and mutation
    const nextGeneration: Rectangle[][] = [...selected];
    
    while (nextGeneration.length < populationSize) {
      const parent1 = selected[Math.floor(Math.random() * selected.length)];
      const parent2 = selected[Math.floor(Math.random() * selected.length)];
      
      let child = crossover(parent1, parent2);
      if (Math.random() < mutationRate) {
        child = mutate(child, width, height, sheetWidth, sheetLength, allowRotation);
      }
      
      nextGeneration.push(child);
    }
    
    population = nextGeneration;
  }
  
  // Return best solution
  const finalFitness = population.map(solution => evaluateFitness(solution, sheetWidth, sheetLength));
  const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));
  return population[bestIndex];
}

/**
 * Helper: Find bottom-left position for a piece
 */
function findBottomLeftPosition(
  width: number,
  height: number,
  sheetWidth: number,
  sheetLength: number,
  occupied: Rectangle[],
  allowRotation: boolean
): Rectangle | null {
  const orientations = allowRotation ? 
    [{ w: width, h: height, rot: 0 as const }, { w: height, h: width, rot: 90 as const }] :
    [{ w: width, h: height, rot: 0 as const }];
  
  for (const { w, h, rot } of orientations) {
    for (let y = 0; y <= sheetLength - h; y += 5) { // Step by 5mm for performance
      for (let x = 0; x <= sheetWidth - w; x += 5) {
        const candidate = { x, y, width: w, height: h, rotation: rot };
        
        if (!hasOverlap(candidate, occupied)) {
          return candidate;
        }
      }
    }
  }
  
  return null;
}

/**
 * Helper: Find best fit position (minimizes waste)
 */
function findBestFitPosition(
  width: number,
  height: number,
  sheetWidth: number,
  sheetLength: number,
  occupied: Rectangle[],
  allowRotation: boolean
): Rectangle | null {
  let bestPosition: Rectangle | null = null;
  let bestScore = -1;
  
  const orientations = allowRotation ? 
    [{ w: width, h: height, rot: 0 as const }, { w: height, h: width, rot: 90 as const }] :
    [{ w: width, h: height, rot: 0 as const }];
  
  for (const { w, h, rot } of orientations) {
    for (let y = 0; y <= sheetLength - h; y += 10) {
      for (let x = 0; x <= sheetWidth - w; x += 10) {
        const candidate = { x, y, width: w, height: h, rotation: rot };
        
        if (!hasOverlap(candidate, occupied)) {
          const score = calculatePositionScore(candidate, occupied, sheetWidth, sheetLength);
          if (score > bestScore) {
            bestScore = score;
            bestPosition = candidate;
          }
        }
      }
    }
  }
  
  return bestPosition;
}

/**
 * Helper: Check if rectangles overlap
 */
function hasOverlap(rect: Rectangle, others: Rectangle[]): boolean {
  return others.some(other => 
    rect.x < other.x + other.width &&
    rect.x + rect.width > other.x &&
    rect.y < other.y + other.height &&
    rect.y + rect.height > other.y
  );
}

/**
 * Helper: Calculate position score for best fit
 */
function calculatePositionScore(rect: Rectangle, occupied: Rectangle[], sheetWidth: number, sheetLength: number): number {
  // Prefer positions that are close to other pieces and edges (reduces waste)
  let score = 0;
  
  // Bonus for being near bottom and left edges
  score += (sheetLength - rect.y) / sheetLength * 100;
  score += (sheetWidth - rect.x) / sheetWidth * 50;
  
  // Bonus for being near other pieces
  occupied.forEach(other => {
    const distance = Math.sqrt(
      Math.pow(rect.x - other.x, 2) + Math.pow(rect.y - other.y, 2)
    );
    if (distance < 100) {
      score += (100 - distance) / 100 * 75;
    }
  });
  
  return score;
}

/**
 * Genetic Algorithm Helpers
 */
function generateRandomSolution(
  width: number,
  height: number,
  sheetWidth: number,
  sheetLength: number,
  quantity: number,
  allowRotation: boolean
): Rectangle[] {
  const solution: Rectangle[] = [];
  
  for (let i = 0; i < quantity; i++) {
    const rotation = allowRotation && Math.random() > 0.5 ? 90 : 0;
    const w = rotation === 90 ? height : width;
    const h = rotation === 90 ? width : height;
    
    const maxX = Math.max(0, sheetWidth - w);
    const maxY = Math.max(0, sheetLength - h);
    
    const rect = {
      x: Math.floor(Math.random() * (maxX + 1)),
      y: Math.floor(Math.random() * (maxY + 1)),
      width: w,
      height: h,
      rotation: rotation as 0 | 90
    };
    
    if (!hasOverlap(rect, solution)) {
      solution.push(rect);
    }
  }
  
  return solution;
}

function evaluateFitness(solution: Rectangle[], sheetWidth: number, sheetLength: number): number {
  if (solution.length === 0) return 0;
  
  // Calculate bounding box of all pieces
  const maxX = Math.max(...solution.map(r => r.x + r.width));
  const maxY = Math.max(...solution.map(r => r.y + r.height));
  
  const usedArea = solution.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  const boundingArea = maxX * maxY;
  
  // Fitness = (pieces placed * 1000) + (area efficiency * 500)
  return solution.length * 1000 + (usedArea / boundingArea) * 500;
}

function selectBest(population: Rectangle[][], fitness: number[], count: number): Rectangle[][] {
  const indexed = population.map((solution, index) => ({ solution, fitness: fitness[index] }));
  indexed.sort((a, b) => b.fitness - a.fitness);
  return indexed.slice(0, count).map(item => item.solution);
}

function crossover(parent1: Rectangle[], parent2: Rectangle[]): Rectangle[] {
  const midpoint = Math.floor(Math.random() * Math.min(parent1.length, parent2.length));
  return [...parent1.slice(0, midpoint), ...parent2.slice(midpoint)];
}

function mutate(
  solution: Rectangle[],
  width: number,
  height: number,
  sheetWidth: number,
  sheetLength: number,
  allowRotation: boolean
): Rectangle[] {
  if (solution.length === 0) return solution;
  
  const mutated = [...solution];
  const index = Math.floor(Math.random() * mutated.length);
  const piece = mutated[index];
  
  // Random mutation: change position or rotation
  if (Math.random() > 0.5) {
    // Change position
    const maxX = Math.max(0, sheetWidth - piece.width);
    const maxY = Math.max(0, sheetLength - piece.height);
    piece.x = Math.floor(Math.random() * (maxX + 1));
    piece.y = Math.floor(Math.random() * (maxY + 1));
  } else if (allowRotation) {
    // Change rotation
    const newRotation = piece.rotation === 0 ? 90 : 0;
    const newWidth = newRotation === 90 ? height : width;
    const newHeight = newRotation === 90 ? width : height;
    
    if (piece.x + newWidth <= sheetWidth && piece.y + newHeight <= sheetLength) {
      piece.rotation = newRotation as 0 | 90;
      piece.width = newWidth;
      piece.height = newHeight;
    }
  }
  
  return mutated;
}

/**
 * Helper: Simple grid fallback
 */
function calculateSimpleGrid(
  partWidth: number,
  partHeight: number,
  sheetWidth: number,
  spacing: number,
  kerf: number,
  quantity: number
): Rectangle[] {
  const effectiveWidth = partWidth + spacing + kerf;
  const effectiveHeight = partHeight + spacing + kerf;
  
  const piecesPerRow = Math.floor(sheetWidth / effectiveWidth);
  if (piecesPerRow === 0) return [];
  
  const pieces: Rectangle[] = [];
  let placed = 0;
  
  for (let row = 0; placed < quantity; row++) {
    for (let col = 0; col < piecesPerRow && placed < quantity; col++) {
      pieces.push({
        x: col * effectiveWidth,
        y: row * effectiveHeight,
        width: partWidth,
        height: partHeight,
        rotation: 0
      });
      placed++;
    }
  }
  
  return pieces;
}

/**
 * Helper: Create empty result for impossible nesting
 */
function createEmptyResult(algorithm: string, sheetWidth: string): NestingResult {
  return {
    algorithm_used: algorithm,
    orientation: 0,
    pieces_per_row: "0",
    rows: "0",
    total_length_mm: "0",
    rest_width_mm: sheetWidth,
    material_m2: { i: "0", scale: 6 },
    efficiency_percent: "0",
    pieces_placed: []
  };
}

/**
 * Helper: Convert simple grid to advanced result format
 */
function convertSimpleToAdvanced(pieces: Rectangle[], algorithm: string): NestingResult {
  if (pieces.length === 0) {
    return {
      algorithm_used: algorithm,
      orientation: 0,
      pieces_per_row: "0",
      rows: "0",
      total_length_mm: "0",
      rest_width_mm: "0",
      material_m2: { i: "0", scale: 6 },
      efficiency_percent: "0",
      pieces_placed: []
    };
  }
  
  const maxY = Math.max(...pieces.map(p => p.y + p.height));
  const rows = Math.max(...pieces.map(p => Math.floor(p.y / pieces[0].height))) + 1;
  const piecesPerRow = Math.max(...pieces.map(p => Math.floor(p.x / pieces[0].width))) + 1;
  
  return {
    algorithm_used: algorithm,
    orientation: 0,
    pieces_per_row: piecesPerRow.toString(),
    rows: rows.toString(),
    total_length_mm: maxY.toString(),
    rest_width_mm: "0",
    material_m2: { i: "0", scale: 6 }, // Calculate properly in production
    efficiency_percent: "85", // Estimate for simple grid
    pieces_placed: pieces
  };
}

/**
 * Helper: Create advanced result from placed pieces
 */
function createAdvancedResult(
  pieces: Rectangle[],
  sheetWidth: number,
  sheetLength: number,
  algorithm: string,
  targetQuantity: number
): NestingResult {
  if (pieces.length === 0) {
    return createEmptyResult(algorithm, sheetWidth.toString());
  }
  
  const maxX = Math.max(...pieces.map(p => p.x + p.width));
  const maxY = Math.max(...pieces.map(p => p.y + p.height));
  
  const usedArea = pieces.reduce((sum, p) => sum + p.width * p.height, 0);
  const boundingArea = maxX * maxY;
  const efficiency = Math.round((usedArea / boundingArea) * 100);
  
  const materialMm2 = sheetWidth * maxY;
  const materialM2 = mmToM2(materialMm2.toString());
  
  return {
    algorithm_used: algorithm,
    orientation: 0,
    pieces_per_row: "variable", // Advanced algorithms don't use fixed grid
    rows: Math.ceil(pieces.length / Math.max(1, Math.floor(sheetWidth / pieces[0]?.width || 1))).toString(),
    total_length_mm: maxY.toString(),
    rest_width_mm: Math.max(0, sheetWidth - maxX).toString(),
    material_m2: materialM2,
    efficiency_percent: efficiency.toString(),
    pieces_placed: pieces
  };
}