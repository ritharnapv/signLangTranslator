import React, { useState, useEffect, useMemo } from 'react';
import { ASLGesture } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  Star, 
  Search, 
  Flame, 
  Award, 
  Volume2, 
  Info, 
  ChevronRight, 
  Bookmark, 
  Filter, 
  RotateCcw, 
  AlertCircle, 
  Activity, 
  CheckCircle2, 
  HelpCircle, 
  Sliders
} from 'lucide-react';

// Expanded and rich sign language reference dictionary database
const DICTIONARY_GESTURES: ASLGesture[] = [
  {
    id: "sign_a",
    char: "A",
    description: "Make a tightly closed fist, keeping your thumb vertically aligned on the outside edge of your index finger.",
    category: "alphabet",
    visualTip: "Fist closed tightly, thumb aligned vertically touching the index finger's side.",
    meaning: "The first letter of the ASL manual alphabet, representing the character 'A' or used as a baseline fist posture.",
    synonyms: ["Letter A", "First Alphabet", "Initial A"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Form a tightly closed fist with your dominant hand.",
      "Keep all four fingers curled inward flat against your palm skin.",
      "Extend your thumb upwards along the outer side edge of your index finger knuckle."
    ]
  },
  {
    id: "sign_b",
    char: "B",
    description: "Hold your four fingers flat and straight up. Tuck your thumb folded inside across your palm.",
    category: "alphabet",
    visualTip: "Open flat upright palm, thumb securely folded inward across the palm skin.",
    meaning: "The second letter of the ASL manual alphabet, also representing the number '4' or used to depict flat surfaces.",
    synonyms: ["Letter B", "Flat Palm", "Number 4", "Beta"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Hold your four fingers flat, vertical, and pressed tightly together side-by-side.",
      "Fold your thumb horizontally inward across your palm, resting near the base of your pinky.",
      "Keep your wrist straight and hand parallel to your body."
    ]
  },
  {
    id: "sign_c",
    char: "C",
    description: "Curve all four fingers and your thumb to mimic a semi-circular cup shape resembling the letter C.",
    category: "alphabet",
    visualTip: "Clear semi-circular profile shape, ensuring distinct space between finger tips and thumb.",
    meaning: "The third letter of the manual alphabet, representing the letter 'C' or used as a classifier for drinking cups or containers.",
    synonyms: ["Letter C", "Cup Shape", "Semicircle", "Curve"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Slightly bend all four fingers forward together in an arched curve.",
      "Oppose your thumb pointing upward and curve it to match, forming a semi-circular ring profile.",
      "Ensure there is a clear visible space between your fingertips and thumb."
    ]
  },
  {
    id: "sign_d",
    char: "D",
    description: "Extend your index finger straight up. Touch your middle, ring, and pinky finger tips directly to your thumb tip.",
    category: "alphabet",
    visualTip: "Index pointing vertically alone, other three fingers forming a tight circular contact loop with thumb.",
    meaning: "The fourth letter of the ASL alphabet, representing the character 'D' or indicating singular pointer focus.",
    synonyms: ["Letter D", "Pointer", "Delta", "Directional"],
    difficulty: "medium",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend your index finger straight up pointing to the sky.",
      "Curve your middle, ring, and pinky fingers downward in a circle.",
      "Touch the tips of those three fingers directly to your thumb tip to form a loop."
    ]
  },
  {
    id: "sign_e",
    char: "E",
    description: "Fold your four fingers slightly to touch their pads to the top edge of your tucked-in thumb.",
    category: "alphabet",
    visualTip: "Curled knuckles layout directly stacked upon horizontal thumb baseline. Looks like an outline curve.",
    meaning: "The fifth manual letter 'E'. Widely considered a moderately tight fist transition sign.",
    synonyms: ["Letter E", "Squeezed Fist", "Claw Hook"],
    difficulty: "hard",
    grammaticalRole: "Alphabet",
    steps: [
      "Fold all four of your fingers at the middle joints down towards your palm.",
      "Tuck your thumb horizontally underneath the curled finger pads.",
      "Touch the tips of your fingers directly to the top edge of your folded thumb."
    ]
  },
  {
    id: "sign_f",
    char: "F",
    description: "Touch the tip of your index finger directly to your thumb tip, keeping the other three fingers flared straight and apart.",
    category: "alphabet",
    visualTip: "Circle formed by index and thumb, upper three fingers spread upward like a fan.",
    meaning: "The letter 'F', also used for numbers like '9' or to represent 'OK' in general communication.",
    synonyms: ["Letter F", "OK Hand", "9 Handshape", "Flared"],
    difficulty: "medium",
    grammaticalRole: "Alphabet",
    steps: [
      "Touch the very tip of your index finger directly to your thumb tip, forming a circular contact loop.",
      "Extend your middle, ring, and pinky fingers straight up.",
      "Flare the three extended fingers apart like a fan."
    ]
  },
  {
    id: "sign_g",
    char: "G",
    description: "Extend your index finger and thumb horizontally parallel, with other fingers curled into your palm.",
    category: "alphabet",
    visualTip: "Index finger pointing horizontally to the side, thumb parallel underneath it.",
    meaning: "The letter 'G', also representing a small amount, thickness, or describing narrow boundaries.",
    synonyms: ["Letter G", "Pinch", "Small Width", "Pliers"],
    difficulty: "medium",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend your index finger horizontally pointing to your non-dominant side.",
      "Extend your thumb parallel to the index finger, pointing horizontally as well.",
      "Keep middle, ring, and pinky fingers tucked flat into a fist."
    ]
  },
  {
    id: "sign_h",
    char: "H",
    description: "Extend your index and middle fingers together horizontally pointing sideways, keeping others tucked into your palm.",
    category: "alphabet",
    visualTip: "Index and middle fingers pressed together horizontally.",
    meaning: "The letter 'H', signifying a horizontal double finger line, commonly used in names and descriptions.",
    synonyms: ["Letter H", "Horizontal Two", "Double Pointer"],
    difficulty: "medium",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend both your index finger and middle finger horizontally together side-by-side.",
      "Tuck your thumb behind them, resting it against the side of the index finger.",
      "Keep your ring and pinky fingers curled flat into your palm."
    ]
  },
  {
    id: "sign_i",
    char: "I",
    description: "Make a closed fist with your dominant hand, keeping only your pinky finger extended straight up.",
    category: "alphabet",
    visualTip: "Pinky pointing vertically up, other fingers forming a tight fist.",
    meaning: "The letter 'I', frequently representing pronouns like 'me/myself' or indicating slender objects.",
    synonyms: ["Letter I", "Pinky Up", "Slender", "Tiny"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Form a tightly closed fist with your dominant hand.",
      "Extend your pinky finger straight up into the air vertically.",
      "Keep your thumb tucked securely across the front of your folded index and middle fingers."
    ]
  },
  {
    id: "sign_l",
    char: "L",
    description: "Extend your index finger straight up and your thumb horizontally out to the side at a 90-degree angle.",
    category: "alphabet",
    visualTip: "Thumb and index pointing in a right angle, others folded.",
    meaning: "The letter 'L', indicating a corner, an angle, or representing the shape of an L.",
    synonyms: ["Letter L", "Corner", "Right Angle", "L-Shape"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Point your index finger straight up vertically.",
      "Extend your thumb horizontally outwards at a 90-degree right angle.",
      "Curl your middle, ring, and pinky fingers down into your palm."
    ]
  },
  {
    id: "sign_v",
    char: "V",
    description: "Extend your index and middle fingers straight up, flaring them apart in a V-shape. Keep other fingers tucked.",
    category: "alphabet",
    visualTip: "Index and middle fingers straight up in a V-shape.",
    meaning: "The letter 'V', representing the number '2', or semantically associated with sight, eyes, or looking.",
    synonyms: ["Letter V", "Peace Sign", "Number 2", "Sight"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend your index finger and middle finger straight up vertically.",
      "Flare them apart to form a distinct V or scissors shape.",
      "Tuck your thumb over your folded ring and pinky fingers in the palm."
    ]
  },
  {
    id: "sign_w",
    char: "W",
    description: "Extend your index, middle, and ring fingers straight up flared apart. Touch thumb and pinky tips.",
    category: "alphabet",
    visualTip: "Index, middle, and ring fingers flared up, thumb touching pinky.",
    meaning: "The letter 'W', representing the number '3' in manual counting, or indicating water, world, or network.",
    synonyms: ["Letter W", "Number 3", "Triad", "Water Shape"],
    difficulty: "medium",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend your index, middle, and ring fingers straight up vertically.",
      "Spread the three extended fingers slightly apart from each other.",
      "Bring your thumb and pinky finger tips together to touch in a circular loop at the bottom."
    ]
  },
  {
    id: "sign_y",
    char: "Y",
    description: "Extend only your pinky finger and your thumb outward, folding your three middle fingers into your palm.",
    category: "alphabet",
    visualTip: "Pinky and thumb pointing in opposite directions, middle joints fully compressed.",
    meaning: "The letter 'Y', semantically representing words like 'same', 'similar', or used in cultural 'hang loose' greetings.",
    synonyms: ["Letter Y", "Hang Loose", "Shaka", "Same"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend your thumb fully outward to one side.",
      "Extend your pinky finger fully outward to the opposite side.",
      "Fold your index, middle, and ring fingers tightly down into your palm."
    ]
  },
  {
    id: "sign_hello",
    char: "Hello",
    description: "Place your hand at your forehead with fingers flat and palm facing down, then sweep it outward in a small wave like a salute.",
    category: "greeting",
    visualTip: "Flat vertical hand starting close to the eyebrow peak and moving gracefully outwards.",
    meaning: "A universal friendly greeting or salute used to initiate conversations or announce arrival.",
    synonyms: ["Hi", "Hey", "Greetings", "Salute"],
    difficulty: "easy",
    grammaticalRole: "Greeting",
    steps: [
      "Bring your flat open dominant hand up to the side of your forehead.",
      "Keep your fingers straight and pressed together, with palm facing slightly downward.",
      "Sweep your hand horizontally outward and downward in a brief saluting wave gesture."
    ]
  },
  {
    id: "sign_thanks",
    char: "Thank You",
    description: "Touch the fingers of your flat, open hand to your lips, then move your hand downward and forward toward the person.",
    category: "greeting",
    visualTip: "Start flat at mouth height, motioning fluidly outwards with palm face facing upward.",
    meaning: "A polite expression of appreciation, thankfulness, or gratitude directed toward the recipient.",
    synonyms: ["Thanks", "Appreciation", "Grateful", "Gratitude"],
    difficulty: "easy",
    grammaticalRole: "Greeting",
    steps: [
      "Place the fingertips of your flat open dominant hand directly against your lips.",
      "Move your hand outward and downward in a smooth arc toward the person you are thanking.",
      "Finish the movement with your hand extended forward, palm facing upward."
    ]
  },
  {
    id: "sign_yes",
    char: "Yes",
    description: "Make a closed fist (with palm facing forward), then rock or tilt your wrist forward and back repeatedly to mimic a nodding head.",
    category: "greeting",
    visualTip: "Nodding closed fist representing head motion up and down.",
    meaning: "Affirmation, agreement, or assent. This gesture directly mimics a nodding head.",
    synonyms: ["Yeah", "Correct", "Agree", "Nod"],
    difficulty: "easy",
    grammaticalRole: "Greeting",
    steps: [
      "Form a loose closed fist with your dominant hand at shoulder height, palm facing forward.",
      "Using only your wrist joint, tilt your fist forward and down.",
      "Repeat this nodding motion two or three times to emphasize affirmation."
    ]
  },
  {
    id: "sign_no",
    char: "No",
    description: "Extend your index and middle fingers together, then tap them down quickly against your extended thumb tip.",
    category: "greeting",
    visualTip: "Index and middle finger together snapping down onto thumb twice.",
    meaning: "Negation, disagreement, or refusal. The tapping motion represents a mouth closing shut on a word.",
    synonyms: ["Nope", "Refusal", "Negate", "Incorrect"],
    difficulty: "easy",
    grammaticalRole: "Greeting",
    steps: [
      "Extend your index and middle fingers straight out side-by-side.",
      "Extend your thumb outward pointing slightly upward.",
      "Quickly snap the index and middle fingers downward together to tap against your thumb tip twice."
    ]
  },
  {
    id: "sign_help",
    char: "Help",
    description: "Place your closed fist hand (with thumb pointing straight up, like a 'thumbs-up') on top of your flat open non-dominant palm, then lift them up together.",
    category: "greeting",
    visualTip: "Thumbs-up resting on a flat open palm, lifted upward as a unit.",
    meaning: "A request for assistance, aid, or support, or offering rescue/help to another person.",
    synonyms: ["Aid", "Assist", "Rescue", "Support"],
    difficulty: "medium",
    grammaticalRole: "Greeting",
    steps: [
      "Form a 'thumbs-up' gesture with your dominant hand (closed fist, thumb pointing up).",
      "Rest the base of this fist flat on the palm of your open, flat non-dominant hand.",
      "Lift both hands upward together a few inches in a single cohesive motion."
    ]
  },
  {
    id: "sign_love",
    char: "Love",
    description: "Cross both fists over your chest, palms facing inward against your body.",
    category: "common",
    visualTip: "Fists crossed over chest, hugging your shoulders tightly.",
    meaning: "An expression of deep affection, care, love, or warm emotion.",
    synonyms: ["Adore", "Affection", "Hug", "Heartfelt"],
    difficulty: "easy",
    grammaticalRole: "Common Word",
    steps: [
      "Form loose fists with both your left and right hands.",
      "Cross your forearms over your chest in an 'X' shape.",
      "Press the back of your fists gently against your upper chest near the opposite shoulders."
    ]
  },
  {
    id: "sign_please",
    char: "Please",
    description: "Place your flat open hand against your chest and move it in circular motions clockwise.",
    category: "common",
    visualTip: "Flat palm on center of chest moving in circular motions.",
    meaning: "A polite word used to accompany a request, indicating respect and goodwill.",
    synonyms: ["Kindly", "Request", "Entreat", "Polite"],
    difficulty: "easy",
    grammaticalRole: "Common Word",
    steps: [
      "Place your open flat dominant hand palm-down against the center of your chest.",
      "Spread your fingers straight and pressed together.",
      "Move your hand in a circular pattern clockwise over your chest twice, keeping contact."
    ]
  },
  {
    id: "sign_sorry",
    char: "Sorry",
    description: "Make a closed fist with your dominant hand and rub it in circular motions over your chest.",
    category: "common",
    visualTip: "Fist on center of chest rubbing in clockwise circular motions.",
    meaning: "An expression of regret, apology, remorse, or sympathy.",
    synonyms: ["Apologize", "Regret", "Repent", "Forgive"],
    difficulty: "easy",
    grammaticalRole: "Common Word",
    steps: [
      "Make a closed fist with your dominant hand, knuckles facing outward.",
      "Place your fist flat against the center of your chest.",
      "Rotate your fist in clockwise circular motions over your chest area two or three times."
    ]
  },
  {
    id: "sign_friend",
    char: "Friend",
    description: "Interlock your curved index fingers, hook them together, then reverse the hook.",
    category: "common",
    visualTip: "Two hooked index fingers interlocking and reversing in a loop.",
    meaning: "Representing a companion, pal, buddy, or a close mutual bond of affection.",
    synonyms: ["Pal", "Buddy", "Companion", "Amigo"],
    difficulty: "hard",
    grammaticalRole: "Common Word",
    steps: [
      "Hook your dominant index finger over the top of your curved non-dominant index finger.",
      "Keep other fingers tucked back in fists.",
      "Unlink them, reverse your hand positions, and hook the non-dominant index finger over the dominant index finger."
    ]
  },
  {
    id: "sign_0",
    char: "0",
    description: "Form a tight circle with all your fingers and thumb tips touching to resemble the number 0.",
    category: "numbers",
    visualTip: "All fingertips touching your thumb to form a hollow circle.",
    meaning: "The numerical value zero '0'. In ASL, it looks identical to the letter 'O'.",
    synonyms: ["Zero", "Digit 0", "Empty Set"],
    difficulty: "easy",
    grammaticalRole: "Number",
    steps: [
      "Curve all four of your fingers inward.",
      "Bring the tip of your thumb to touch the tips of all four fingers simultaneously.",
      "Ensure the profile is circular, creating a hollow O-ring space."
    ]
  },
  {
    id: "sign_1",
    char: "1",
    description: "Extend your index finger straight up. Keep other fingers curled in a fist with thumb across palm.",
    category: "numbers",
    visualTip: "Single index finger pointed straight up with palm facing inward.",
    meaning: "The numerical value one '1'.",
    synonyms: ["One", "Single", "Digit 1"],
    difficulty: "easy",
    grammaticalRole: "Number",
    steps: [
      "Form a clenched fist with your dominant hand.",
      "Extend only your index finger straight up vertically.",
      "Fold your thumb across your curled middle, ring, and pinky fingers."
    ]
  },
  {
    id: "sign_2",
    char: "2",
    description: "Extend your index and middle fingers straight up and spread them. Keep other fingers curled.",
    category: "numbers",
    visualTip: "Index and middle fingers extended in a spread V-shape.",
    meaning: "The numerical value two '2'.",
    synonyms: ["Two", "Pair", "Digit 2"],
    difficulty: "easy",
    grammaticalRole: "Number",
    steps: [
      "Form a fist with your dominant hand.",
      "Extend your index and middle fingers straight up vertically.",
      "Spread the two extended fingers slightly apart, similar to a peace sign."
    ]
  },
  {
    id: "sign_3",
    char: "3",
    description: "Extend your thumb, index, and middle fingers. Curl your ring and pinky fingers into your palm.",
    category: "numbers",
    visualTip: "Thumb, index, and middle fingers extended and spread.",
    meaning: "The numerical value three '3'. Note that in ASL, '3' uses the thumb instead of the ring finger.",
    synonyms: ["Three", "Trio", "Digit 3"],
    difficulty: "medium",
    grammaticalRole: "Number",
    steps: [
      "Clench your ring and pinky fingers into your palm.",
      "Extend your thumb outward horizontally.",
      "Extend your index and middle fingers straight up vertically, spreading all three apart."
    ]
  },
  {
    id: "sign_4",
    char: "4",
    description: "Extend all four fingers straight up and spread them wide. Fold your thumb across your palm.",
    category: "numbers",
    visualTip: "Four fingers spread straight up, thumb tucked inward.",
    meaning: "The numerical value four '4'.",
    synonyms: ["Four", "Digit 4"],
    difficulty: "easy",
    grammaticalRole: "Number",
    steps: [
      "Extend your index, middle, ring, and pinky fingers straight up.",
      "Spread the four fingers apart from each other.",
      "Fold your thumb horizontally across your palm."
    ]
  },
  {
    id: "sign_5",
    char: "5",
    description: "Extend all five fingers straight up and spread them apart as wide as possible.",
    category: "numbers",
    visualTip: "An open, fully spread hand with all five fingers straight.",
    meaning: "The numerical value five '5'.",
    synonyms: ["Five", "Full Hand", "Digit 5"],
    difficulty: "easy",
    grammaticalRole: "Number",
    steps: [
      "Open your dominant hand fully.",
      "Extend all five fingers straight up and outwards.",
      "Spread all fingers and thumb as wide apart as possible."
    ]
  },
  {
    id: "sign_6",
    char: "6",
    description: "Touch the tip of your pinky finger directly to your thumb tip, keeping index, middle, and ring fingers extended.",
    category: "numbers",
    visualTip: "Pinky and thumb touching, other three fingers extended straight up.",
    meaning: "The numerical value six '6'. In ASL, counting 6-9 starts by touching fingers to the thumb.",
    synonyms: ["Six", "Digit 6"],
    difficulty: "medium",
    grammaticalRole: "Number",
    steps: [
      "Extend your index, middle, and ring fingers straight up.",
      "Curve your pinky finger and thumb inward.",
      "Touch the very tip of your pinky directly to your thumb tip."
    ]
  },
  {
    id: "sign_7",
    char: "7",
    description: "Touch the tip of your ring finger directly to your thumb tip, keeping index, middle, and pinky fingers extended.",
    category: "numbers",
    visualTip: "Ring finger and thumb touching, other fingers extended straight up.",
    meaning: "The numerical value seven '7'.",
    synonyms: ["Seven", "Digit 7"],
    difficulty: "medium",
    grammaticalRole: "Number",
    steps: [
      "Extend your index, middle, and pinky fingers straight up.",
      "Curve your ring finger and thumb inward.",
      "Touch the very tip of your ring finger directly to your thumb tip."
    ]
  },
  {
    id: "sign_8",
    char: "8",
    description: "Touch the tip of your middle finger directly to your thumb tip, keeping index, ring, and pinky fingers extended.",
    category: "numbers",
    visualTip: "Middle finger and thumb touching, other fingers extended straight up.",
    meaning: "The numerical value eight '8'.",
    synonyms: ["Eight", "Digit 8"],
    difficulty: "medium",
    grammaticalRole: "Number",
    steps: [
      "Extend your index, ring, and pinky fingers straight up.",
      "Curve your middle finger and thumb inward.",
      "Touch the very tip of your middle finger directly to your thumb tip."
    ]
  },
  {
    id: "sign_9",
    char: "9",
    description: "Touch the tip of your index finger directly to your thumb tip, keeping middle, ring, and pinky fingers extended.",
    category: "numbers",
    visualTip: "Index finger and thumb touching, other three fingers extended straight up.",
    meaning: "The numerical value nine '9'. Identical in handshape to the manual letter 'F'.",
    synonyms: ["Nine", "Digit 9", "Letter F"],
    difficulty: "medium",
    grammaticalRole: "Number",
    steps: [
      "Extend your middle, ring, and pinky fingers straight up.",
      "Curve your index finger and thumb inward.",
      "Touch the very tip of your index finger directly to your thumb tip."
    ]
  }
];

// Connection lines for the hand skeleton
const SKELETON_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Knuckle knuckles base connections
  [5, 9], [9, 13], [13, 17]
];

// Helper to construct realistic procedural coordinates for hand bones
function getHandLandmarks(char: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  
  // Base wrist position (anchored)
  const wrist = { x: 100, y: 175 };
  points.push(wrist); // Index 0
  
  const c = char.toUpperCase();

  // Helper function to append finger joint coordinates
  const addFinger = (
    baseX: number, 
    baseY: number, 
    angleDeg: number, 
    length: number, 
    isFolded: boolean, 
    isCurved: boolean, 
    curveDir = 1
  ) => {
    const angle = (angleDeg * Math.PI) / 180;
    const numJoints = 4;
    let currX = baseX;
    let currY = baseY;
    
    for (let i = 1; i <= numJoints; i++) {
      const segmentLen = (length / numJoints) * (1.15 - i * 0.05);
      
      let stepX = Math.sin(angle) * segmentLen;
      let stepY = -Math.cos(angle) * segmentLen;
      
      if (isFolded) {
        // Bend fingers back into palm bounds
        const ratio = i / numJoints;
        currX = baseX + (100 - baseX) * ratio * 0.45;
        currY = baseY + (145 - baseY) * ratio * 0.6 + i * 4.5;
      } else if (isCurved) {
        // Bend fingers in circular arc
        const curveAngle = angle + (curveDir * (i * 26 * Math.PI) / 180);
        currX += Math.sin(curveAngle) * segmentLen;
        currY -= Math.cos(curveAngle) * segmentLen;
      } else {
        // Flat extended finger
        currX += stepX;
        currY += stepY;
      }
      
      points.push({ x: Math.round(currX), y: Math.round(currY) });
    }
  };

  // Default finger attributes
  let thumbFolded = false, indexFolded = false, middleFolded = false, ringFolded = false, pinkyFolded = false;
  let thumbCurved = false, indexCurved = false, middleCurved = false, ringCurved = false, pinkyCurved = false;
  let thumbAngle = -42, indexAngle = -10, middleAngle = 0, ringAngle = 10, pinkyAngle = 22;
  const fingerLength = 52;

  // Finger layout modifications per sign
  if (c === 'A' || c === 'YES' || c === 'SORRY') {
    thumbFolded = true; indexFolded = true; middleFolded = true; ringFolded = true; pinkyFolded = true;
    thumbAngle = -15; // thumb pressed against side of fist
  } else if (c === 'B' || c === 'HELLO' || c === 'PLEASE' || c === 'GOOD' || c === 'GOODBYE') {
    thumbFolded = true; // thumb tucked over palm surface, others extended straight
  } else if (c === 'C' || c === 'O') {
    thumbCurved = true; indexCurved = true; middleCurved = true; ringCurved = true; pinkyCurved = true;
  } else if (c === 'D') {
    middleFolded = true; ringFolded = true; pinkyFolded = true;
    // thumb meets folded fingers
    thumbAngle = -35; thumbCurved = true;
  } else if (c === 'E') {
    indexFolded = true; middleFolded = true; ringFolded = true; pinkyFolded = true;
    thumbFolded = true; thumbAngle = -20;
  } else if (c === 'F') {
    indexCurved = true; thumbCurved = true;
    indexAngle = -25; thumbAngle = -35;
  } else if (c === 'G') {
    middleFolded = true; ringFolded = true; pinkyFolded = true;
    indexAngle = -75; thumbAngle = -45;
  } else if (c === 'H') {
    ringFolded = true; pinkyFolded = true;
    indexAngle = -70; middleAngle = -60;
    thumbFolded = true;
  } else if (c === 'I') {
    indexFolded = true; middleFolded = true; ringFolded = true;
    thumbFolded = true;
  } else if (c === 'L') {
    middleFolded = true; ringFolded = true; pinkyFolded = true;
    indexAngle = 0; thumbAngle = -85;
  } else if (c === 'Y') {
    indexFolded = true; middleFolded = true; ringFolded = true;
    thumbAngle = -80; pinkyAngle = 45;
  } else if (c === 'LOVE') {
    middleFolded = true; ringFolded = true;
    thumbAngle = -75; indexAngle = -5; pinkyAngle = 28;
  } else if (c === 'V' || c === 'NO') {
    ringFolded = true; pinkyFolded = true;
    indexAngle = -15; middleAngle = 15;
    thumbFolded = true;
  } else if (c === 'W') {
    pinkyFolded = true;
    indexAngle = -20; middleAngle = 0; ringAngle = 20;
    thumbFolded = true;
  } else if (c === 'HELP') {
    indexFolded = true; middleFolded = true; ringFolded = true; pinkyFolded = true;
    thumbAngle = -10; // Thumb pointing straight up like thumbs-up
  } else if (c === 'FRIEND') {
    indexCurved = true; middleFolded = true; ringFolded = true; pinkyFolded = true;
    thumbAngle = -50;
  } else if (c === '0') {
    thumbCurved = true; indexCurved = true; middleCurved = true; ringCurved = true; pinkyCurved = true;
  } else if (c === '1') {
    middleFolded = true; ringFolded = true; pinkyFolded = true;
    indexAngle = 0; thumbFolded = true;
  } else if (c === '2') {
    ringFolded = true; pinkyFolded = true;
    indexAngle = -15; middleAngle = 15;
    thumbFolded = true;
  } else if (c === '3') {
    ringFolded = true; pinkyFolded = true;
    indexAngle = -15; middleAngle = 15;
    thumbAngle = -85;
  } else if (c === '4') {
    thumbFolded = true;
    indexAngle = -15; middleAngle = -5; ringAngle = 5; pinkyAngle = 15;
  } else if (c === '5') {
    thumbAngle = -85;
    indexAngle = -20; middleAngle = 0; ringAngle = 20; pinkyAngle = 35;
  } else if (c === '6') {
    pinkyCurved = true; thumbCurved = true;
    indexAngle = -15; middleAngle = 0; ringAngle = 15;
    pinkyAngle = 30; thumbAngle = -20;
  } else if (c === '7') {
    ringCurved = true; thumbCurved = true;
    indexAngle = -15; middleAngle = 0; pinkyAngle = 25;
    ringAngle = 15; thumbAngle = -20;
  } else if (c === '8') {
    middleCurved = true; thumbCurved = true;
    indexAngle = -15; ringAngle = 15; pinkyAngle = 25;
    middleAngle = 0; thumbAngle = -20;
  } else if (c === '9') {
    indexCurved = true; thumbCurved = true;
    indexAngle = -25; thumbAngle = -35;
    middleAngle = -5; ringAngle = 10; pinkyAngle = 25;
  }

  // Draw 5 fingers starting from their anatomical bases in knuckles
  // Index 1-4: Thumb
  addFinger(82, 145, thumbAngle, fingerLength * 0.70, thumbFolded, thumbCurved, -1);
  // Index 5-8: Index Finger
  addFinger(86, 115, indexAngle, fingerLength, indexFolded, indexCurved, 1);
  // Index 9-12: Middle Finger
  addFinger(100, 110, middleAngle, fingerLength * 1.05, middleFolded, middleCurved, 1);
  // Index 13-16: Ring Finger
  addFinger(114, 115, ringAngle, fingerLength * 0.95, ringFolded, ringCurved, 1);
  // Index 17-20: Pinky Finger
  addFinger(128, 125, pinkyAngle, fingerLength * 0.80, pinkyFolded, pinkyCurved, 1);

  return points;
}

interface SignDictionaryProps {
  onSelectGesture: (gesture: ASLGesture) => void;
  activeGesture: ASLGesture | null;
  customGestures?: ASLGesture[];
}

export default function SignDictionary({ onSelectGesture, activeGesture, customGestures = [] }: SignDictionaryProps) {
  // State variables for filter and layout configuration
  const [activeCategory, setActiveCategory] = useState<'all' | 'alphabet' | 'numbers' | 'greeting' | 'common' | 'custom' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [animateSkeleton, setAnimateSkeleton] = useState(true);
  const [showJointLabels, setShowJointLabels] = useState(false);
  
  // Bookmarks loaded from local storage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('asl_dictionary_bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Track currently inspected sign
  const [inspectedGesture, setInspectedGesture] = useState<ASLGesture | null>(null);

  // Sync bookmarks with localStorage
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection
    setBookmarkedIds(prev => {
      const updated = prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id];
      localStorage.setItem('asl_dictionary_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  // Speak sign details using browser TTS
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakSign = (gesture: ASLGesture) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Sign for ${gesture.char}. Grammatical role is ${gesture.grammaticalRole || gesture.category}. Meaning: ${gesture.meaning || gesture.description}. Formed with a ${gesture.difficulty} difficulty posture.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop talking when switching selected cards
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [inspectedGesture]);

  const allGestures = useMemo(() => {
    const customWithCategory = customGestures.map(g => ({
      ...g,
      category: 'custom',
      meaning: g.meaning || "Custom registered gesture sample captured in workspace dataset.",
      difficulty: g.difficulty || 'medium',
      steps: g.steps || ["Lock the pose in webcam scanner", "Perform hand calibration matching joint landmarks"],
      grammaticalRole: g.grammaticalRole || 'Custom Sign'
    }));
    return [...DICTIONARY_GESTURES, ...customWithCategory];
  }, [customGestures]);

  // Set default inspected gesture on load
  useEffect(() => {
    if (activeGesture) {
      const found = allGestures.find(g => g.id === activeGesture.id);
      if (found) setInspectedGesture(found);
    } else if (allGestures.length > 0 && !inspectedGesture) {
      setInspectedGesture(allGestures[0]);
    }
  }, [activeGesture, allGestures]);

  // 1. Filtered and searched list of gestures
  const filteredGestures = useMemo(() => {
    return allGestures.filter(gesture => {
      // Category filter
      const matchesCategory = 
        activeCategory === 'all' || 
        (activeCategory === 'bookmarked' && bookmarkedIds.includes(gesture.id)) ||
        gesture.category === activeCategory;

      // Difficulty filter
      const matchesDifficulty = 
        selectedDifficulty === 'all' || 
        gesture.difficulty === selectedDifficulty;

      // Search query filter (matches character name, description, synonyms, or steps)
      const matchesSearch = 
        searchQuery.trim() === '' ||
        gesture.char.toLowerCase().includes(searchQuery.toLowerCase()) || 
        gesture.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (gesture.meaning && gesture.meaning.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (gesture.synonyms && gesture.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [allGestures, activeCategory, selectedDifficulty, searchQuery, bookmarkedIds]);

  // Get procedural joints for inspected gesture
  const handLandmarks = useMemo(() => {
    if (!inspectedGesture) return [];
    return getHandLandmarks(inspectedGesture.char);
  }, [inspectedGesture]);

  // Stats calculation for dictionary badge counts
  const categoryStats = useMemo(() => {
    const stats = {
      all: allGestures.length,
      alphabet: allGestures.filter(g => g.category === 'alphabet').length,
      greeting: allGestures.filter(g => g.category === 'greeting').length,
      common: allGestures.filter(g => g.category === 'common').length,
      custom: allGestures.filter(g => g.category === 'custom').length,
      bookmarked: bookmarkedIds.length
    };
    return stats;
  }, [allGestures, bookmarkedIds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="comprehensive-dictionary-layout">
      
      {/* LEFT COLUMN: Search filters, category selectors, and gestures grid */}
      <div className="lg:col-span-7 space-y-4 flex flex-col h-full" id="dictionary-browser">
        
        {/* Browser Filter Dashboard Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 shadow-sm space-y-4" id="filters-panel">
          
          {/* Header Title with quick telemetry count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#7c8d7c] dark:text-[#a8baa8]" />
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wide">ASL Dictionary Explorer</h3>
            </div>
            <span className="text-[10px] font-mono bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-2 py-1 rounded-lg text-gray-500 dark:text-zinc-400 font-bold">
              Showing {filteredGestures.length} of {allGestures.length} signs
            </span>
          </div>

          {/* Search bar input with clear button */}
          <div className="relative" id="dictionary-search-box">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#9a9a8a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signs, translations, synonyms, meanings..."
              className="w-full bg-[#fdfcf9] dark:bg-[#131316] border border-[#ecece0] dark:border-[#2d2d32] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c]/30 rounded-xl py-2.5 pl-11 pr-10 text-xs text-[#2d2d28] dark:text-[#f4f4f5] placeholder-[#9a9a8a] outline-none transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Clear query"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filters row (all, alphabet, greeting, common, custom, bookmarked) */}
          <div className="flex flex-wrap items-center gap-1.5" id="category-navigation">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === 'all'
                  ? "bg-[#7c8d7c] text-white shadow-sm"
                  : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-white border border-gray-100 dark:border-zinc-800"
              }`}
            >
              All
              <span className="text-[9px] opacity-70 font-mono">({categoryStats.all})</span>
            </button>
            <button
              onClick={() => setActiveCategory('alphabet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === 'alphabet'
                  ? "bg-[#7c8d7c] text-white shadow-sm"
                  : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-white border border-gray-100 dark:border-zinc-800"
              }`}
            >
              A-Z Alphabets
              <span className="text-[9px] opacity-70 font-mono">({categoryStats.alphabet})</span>
            </button>
            <button
              onClick={() => setActiveCategory('numbers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === 'numbers'
                  ? "bg-[#7c8d7c] text-white shadow-sm"
                  : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-white border border-gray-100 dark:border-zinc-800"
              }`}
            >
              Numbers 0–9
              <span className="text-[9px] opacity-70 font-mono">({categoryStats.numbers})</span>
            </button>
            <button
              onClick={() => setActiveCategory('greeting')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === 'greeting'
                  ? "bg-[#7c8d7c] text-white shadow-sm"
                  : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-white border border-gray-100 dark:border-zinc-800"
              }`}
            >
              Greetings
              <span className="text-[9px] opacity-70 font-mono">({categoryStats.greeting})</span>
            </button>
            <button
              onClick={() => setActiveCategory('common')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === 'common'
                  ? "bg-[#7c8d7c] text-white shadow-sm"
                  : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-white border border-gray-100 dark:border-zinc-800"
              }`}
            >
              Words
              <span className="text-[9px] opacity-70 font-mono">({categoryStats.common})</span>
            </button>
            {categoryStats.custom > 0 && (
              <button
                onClick={() => setActiveCategory('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeCategory === 'custom'
                    ? "bg-[#ebdcd1] text-[#a36b5e] border border-[#ebdcd1] shadow-sm"
                    : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-white border border-gray-100 dark:border-zinc-800"
                }`}
              >
                Custom
                <span className="text-[9px] opacity-70 font-mono">({categoryStats.custom})</span>
              </button>
            )}
            <button
              onClick={() => setActiveCategory('bookmarked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === 'bookmarked'
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/45 shadow-sm"
                  : "bg-gray-50/50 dark:bg-zinc-900/40 text-[#7a7a6a] hover:text-amber-600 dark:hover:text-amber-400 border border-gray-100 dark:border-zinc-800"
              }`}
            >
              <Star className={`w-3 h-3 ${activeCategory === 'bookmarked' ? 'fill-amber-500 text-amber-500' : ''}`} />
              Favorites
              <span className="text-[9px] opacity-70 font-mono">({categoryStats.bookmarked})</span>
            </button>
          </div>

          {/* Advanced Sliders / Difficulty sub-filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#ecece0] dark:border-[#2d2d32]">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-zinc-500 font-sans uppercase tracking-widest">
              <Sliders className="w-3.5 h-3.5" />
              Difficulty Rank
            </div>
            <div className="flex items-center gap-1 bg-[#fdfcf9] dark:bg-zinc-900 p-0.5 rounded-lg border border-[#ecece0] dark:border-[#2d2d32]">
              {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? diff === 'easy' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-[#7c8d7c] border border-emerald-100/30'
                        : diff === 'medium' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 border border-orange-100/30'
                        : diff === 'hard' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-100/30'
                        : 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-400'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Dynamic Cards Grid list container */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800" 
          id="dictionary-scroller-grid"
        >
          {filteredGestures.map((gesture) => {
            const isInspected = inspectedGesture?.id === gesture.id;
            const isTargetLock = activeGesture?.id === gesture.id;
            const isBookmarked = bookmarkedIds.includes(gesture.id);
            
            return (
              <div
                key={gesture.id}
                onClick={() => setInspectedGesture(gesture)}
                className={`group p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isInspected
                    ? "bg-[#f4f6f2] dark:bg-[#202421] border-[#7c8d7c] dark:border-[#4b5e4c] shadow-sm ring-1 ring-[#7c8d7c]/30"
                    : "bg-white dark:bg-[#1e1e22] border-[#ecece0] dark:border-[#2d2d32] hover:border-[#7c8d7c]/60 dark:hover:border-[#4b5e4c]/60 hover:bg-[#fcfdfa] dark:hover:bg-[#1a1a1c]"
                }`}
                id={`dictionary-card-${gesture.char}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-sans font-black tracking-tight text-[#2d2d28] dark:text-[#f4f4f5] group-hover:text-[#7c8d7c] dark:group-hover:text-[#a8baa8] transition-colors">
                        {gesture.char}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border ${
                        gesture.category === 'alphabet' 
                          ? 'bg-[#f0f2ee] dark:bg-[#222622] text-[#7c8d7c] dark:text-[#a8baa8] border-[#e0e4db] dark:border-emerald-900/30' 
                          : gesture.category === 'greeting'
                          ? 'bg-amber-50 dark:bg-[#28241d] text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                          : gesture.category === 'custom' 
                          ? 'bg-purple-50 dark:bg-[#25202a] text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'
                          : 'bg-blue-50 dark:bg-[#1c222b] text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                      }`}>
                        {gesture.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Favorite star trigger */}
                      <button
                        onClick={(e) => toggleBookmark(gesture.id, e)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isBookmarked 
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-200 dark:border-amber-900/30' 
                            : 'text-gray-300 dark:text-zinc-600 hover:text-amber-500 border-transparent'
                        }`}
                        title={isBookmarked ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#5a5a4a] dark:text-[#a1a1aa] leading-relaxed line-clamp-2 mb-3">
                    {gesture.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#ecece0]/80 dark:border-[#2d2d32]/60 flex items-center justify-between text-[10px] font-sans">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-[#a36b5e] dark:text-[#ebdcd1]" />
                    <span className="truncate max-w-[120px] italic">{gesture.visualTip}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Active tracking lock telemetry indicator */}
                    {isTargetLock && (
                      <span className="flex items-center gap-1 text-[9px] text-[#7c8d7c] font-black bg-[#f0f2ee] dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-[#e0e4db] dark:border-emerald-900/50">
                        <span className="w-1 h-1 rounded-full bg-[#7c8d7c] animate-ping" />
                        HUD Active
                      </span>
                    )}

                    {/* Difficulty Badge */}
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      gesture.difficulty === 'easy' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                        : gesture.difficulty === 'medium'
                        ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {gesture.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGestures.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl" id="no-filtered-results">
              <AlertCircle className="w-8 h-8 text-[#a36b5e] mx-auto mb-2 opacity-70" />
              <p className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] font-sans">No matching signs discovered</p>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-1">Try relaxing your search spelling query or adjusting the category filters.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedDifficulty('all'); setActiveCategory('all'); }}
                className="mt-4 px-4 py-1.5 text-xs font-bold text-[#7c8d7c] dark:text-[#a8baa8] bg-[#f0f2ee] dark:bg-emerald-950/20 hover:bg-opacity-80 rounded-xl transition-all border border-[#e0e4db] dark:border-emerald-900/40 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Detail Inspector Panel (Show meaning, steps, joint animations, locks, and TTS) */}
      <div className="lg:col-span-5" id="dictionary-inspector">
        
        {inspectedGesture ? (
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5 sticky top-4" id="sign-inspector-card">
            
            {/* 1. Header Information Panel */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] tracking-tight">
                    "{inspectedGesture.char}"
                  </h2>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                    inspectedGesture.difficulty === 'easy' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
                      : inspectedGesture.difficulty === 'medium'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                  }`}>
                    {inspectedGesture.difficulty} Rank
                  </span>
                </div>
                <div className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] font-medium uppercase tracking-wider flex items-center gap-1">
                  <span>Grammar: <strong>{inspectedGesture.grammaticalRole || 'Alphabet'}</strong></span>
                  <span>•</span>
                  <span>Category: <strong>{inspectedGesture.category}</strong></span>
                </div>
              </div>

              {/* Inspector Quick Trigger Button Toolbar */}
              <div className="flex items-center gap-1.5">
                {/* Audio TTS trigger */}
                <button
                  onClick={() => speakSign(inspectedGesture)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isSpeaking 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-600' 
                      : 'bg-gray-50/50 dark:bg-zinc-900/40 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-800'
                  }`}
                  title="Pronounce Details & Tips"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                </button>

                {/* Bookmark trigger */}
                <button
                  onClick={(e) => toggleBookmark(inspectedGesture.id, e)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    bookmarkedIds.includes(inspectedGesture.id)
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-600'
                      : 'bg-gray-50/50 dark:bg-zinc-900/40 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-zinc-800'
                  }`}
                  title="Bookmark Sign"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(inspectedGesture.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* 2. Interactive SVG Hand Skeleton Posture Canvas (Glow Gesture Illustration) */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#9a9a8a] dark:text-[#a1a1aa] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Posture joints telemetry overlay
              </span>
              
              <div 
                className="relative h-56 w-full rounded-2xl bg-black border border-zinc-800/80 shadow-inner flex items-center justify-center overflow-hidden group/canvas" 
                id="joint-inspector-canvas"
              >
                {/* Visual Blueprint background matrix grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#1c2a1c_1px,transparent_1px)] dark:bg-[radial-gradient(#151f15_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
                
                {/* Telemetry frame tags */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">CALIBRATED_JOINT_RIG</span>
                </div>
                <div className="absolute bottom-3 right-3 text-[8px] font-mono text-zinc-500 tracking-wider pointer-events-none">
                  SKELETAL_GRID_2D
                </div>

                {/* Main Dynamic SVG Skeleton Renderer */}
                <svg 
                  viewBox="0 0 200 200" 
                  className={`w-44 h-44 drop-shadow-[0_0_8px_rgba(124,141,124,0.35)] transition-all duration-500 ${
                    animateSkeleton ? 'animate-[pulse_4s_infinite_ease-in-out]' : ''
                  }`}
                >
                  {/* Connection bone paths */}
                  <g stroke="#7c8d7c" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
                    {SKELETON_CONNECTIONS.map(([start, end], idx) => {
                      const ptStart = handLandmarks[start];
                      const ptEnd = handLandmarks[end];
                      if (!ptStart || !ptEnd) return null;
                      return (
                        <line 
                          key={`bone-${idx}`} 
                          x1={ptStart.x} 
                          y1={ptStart.y} 
                          x2={ptEnd.x} 
                          y2={ptEnd.y} 
                          className="transition-all duration-500"
                        />
                      );
                    })}
                  </g>

                  {/* Joint node circles */}
                  <g>
                    {handLandmarks.map((landmark, idx) => {
                      // Style wrist node larger
                      const isWrist = idx === 0;
                      // Style fingertips differently
                      const isTip = [4, 8, 12, 16, 20].includes(idx);
                      
                      return (
                        <g key={`joint-grp-${idx}`} className="group/node">
                          <circle
                            cx={landmark.x}
                            cy={landmark.y}
                            r={isWrist ? 4.5 : isTip ? 3.5 : 2.5}
                            fill={isWrist ? "#ebdcd1" : isTip ? "#a36b5e" : "#e0a96d"}
                            stroke="#ffffff"
                            strokeWidth="1"
                            className="transition-all duration-500 hover:scale-150 cursor-crosshair"
                          />
                          {showJointLabels && (
                            <text
                              x={landmark.x}
                              y={landmark.y - 6}
                              textAnchor="middle"
                              fontSize="5.5"
                              fontWeight="bold"
                              fill="#9a9a8a"
                              className="font-mono bg-black"
                            >
                              {idx}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Float Settings Overlay panel */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setAnimateSkeleton(p => !p)}
                    className={`px-2 py-1 text-[8px] font-bold font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                      animateSkeleton 
                        ? 'bg-emerald-950/40 text-[#7c8d7c] border border-emerald-900/30' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Toggle heartbeat pulse animation"
                  >
                    Pulse: {animateSkeleton ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowJointLabels(p => !p)}
                    className={`px-2 py-1 text-[8px] font-bold font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                      showJointLabels 
                        ? 'bg-emerald-950/40 text-[#7c8d7c] border border-emerald-900/30' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Show standard 0-20 knuckle coordinates index numbers"
                  >
                    Labels: {showJointLabels ? 'ON' : 'OFF'}
                  </button>
                </div>

              </div>
            </div>

            {/* 3. Broad Semantic Meaning & Synonyms */}
            <div className="space-y-3 p-4 bg-[#fdfcf9] dark:bg-zinc-900/30 border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl" id="meaning-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-zinc-300">
                <Info className="w-4 h-4 text-[#7c8d7c] dark:text-[#a8baa8]" />
                Semantic Meaning & Usage
              </div>
              <p className="text-xs text-[#5a5a4a] dark:text-[#cbd5e1] leading-relaxed">
                {inspectedGesture.meaning || inspectedGesture.description}
              </p>

              {/* Synonyms display pills */}
              {inspectedGesture.synonyms && inspectedGesture.synonyms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#ecece0]/80 dark:border-[#2d2d32]/60">
                  <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 font-bold uppercase mr-1">Equivalent:</span>
                  {inspectedGesture.synonyms.map(syn => (
                    <span 
                      key={syn} 
                      className="text-[10px] font-bold font-mono bg-[#f0f2ee] dark:bg-zinc-900 border border-[#e0e4db] dark:border-zinc-800 px-2 py-0.5 rounded text-gray-600 dark:text-zinc-300"
                    >
                      "{syn}"
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Step-by-Step Signing Guide */}
            {inspectedGesture.steps && (
              <div className="space-y-3" id="step-by-step-signing-instructions">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#9a9a8a] dark:text-[#a1a1aa] block">
                  Step-by-step execution guides
                </span>
                <div className="space-y-2.5">
                  {inspectedGesture.steps.map((step, idx) => (
                    <div 
                      key={`step-${idx}`} 
                      className="flex items-start gap-3 text-xs text-[#5a5a4a] dark:text-[#cbd5e1] leading-relaxed"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f0f2ee] dark:bg-[#2d2d32] text-[#7c8d7c] dark:text-[#a8baa8] font-bold font-sans text-[11px] flex items-center justify-center border border-[#e0e4db] dark:border-[#38383e]">
                        {idx + 1}
                      </span>
                      <p className="mt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. HUD Lock Trigger Call-To-Action (Webcam Lock) */}
            <div className="pt-2 border-t border-[#ecece0]/80 dark:border-[#2d2d32]/60">
              <button
                onClick={() => onSelectGesture(inspectedGesture)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-black text-white bg-[#7c8d7c] dark:bg-[#4a5c4e] hover:bg-opacity-90 rounded-2xl transition-all cursor-pointer shadow-md select-none transform active:scale-[0.98]"
              >
                <Flame className="w-4 h-4 fill-white text-white shrink-0" />
                Active Practice: Lock in Scanner HUD
                <ChevronRight className="w-4 h-4 ml-auto text-emerald-200" />
              </button>
              <span className="text-[9px] text-[#9a9a8a] text-center block mt-1.5 font-medium">
                Locks this sign layout to test alignment accuracy using your system camera live.
              </span>
            </div>

          </div>
        ) : (
          <div className="bg-[#ffffff] dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-10 shadow-sm text-center space-y-3 h-96 flex flex-col items-center justify-center" id="inspector-placeholder">
            <BookOpen className="w-12 h-12 text-[#9a9a8a]/40 animate-pulse" />
            <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5]">Select a manual sign posture</h3>
            <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] max-w-xs leading-relaxed">
              Unlock step-by-step guidelines, semantic definitions, regional translations, and continuous skeletal calibration graphs instantly.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
