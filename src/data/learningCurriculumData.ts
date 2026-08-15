import { LearningTrack, LearningLesson, PracticeGoal, CompletionBadge } from '../types';

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: 'isl-foundations',
    title: 'ISL Foundations & Core Greetings',
    description: 'Master the bedrock of Indian Sign Language: traditional greetings, two-handed vowels, and numbers.',
    level: 'Beginner',
    icon: '🙏',
    signLanguage: 'ISL',
    color: 'from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/40',
    totalLessons: 4,
    completedLessons: 0
  },
  {
    id: 'isl-alphabet-numbers',
    title: 'ISL Two-Handed Alphabet & Numbers',
    description: 'Complete hands-on training for all 26 two-handed letters and numerical counting from 0 to 10.',
    level: 'Beginner',
    icon: '🔤',
    signLanguage: 'ISL',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
    totalLessons: 4,
    completedLessons: 0
  },
  {
    id: 'isl-conversation',
    title: 'Daily Dialogues, Food & Family',
    description: 'Learn vital signs for Indian dining, tea/chai, family members, emotions, and questions.',
    level: 'Intermediate',
    icon: '🍛',
    signLanguage: 'ISL',
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
    totalLessons: 4,
    completedLessons: 0
  },
  {
    id: 'emergency-health',
    title: 'Emergency, Health & Assistance',
    description: 'Critical signs for hospitals, doctors, first-aid, asking for urgent help, and safety.',
    level: 'Intermediate',
    icon: '🏥',
    signLanguage: 'BOTH',
    color: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
    totalLessons: 3,
    completedLessons: 0
  },
  {
    id: 'asl-bridge',
    title: 'ASL Express Bridge',
    description: 'Compare single-handed ASL signs with ISL, expanding your cross-cultural signing proficiency.',
    level: 'Advanced',
    icon: '🌐',
    signLanguage: 'ASL',
    color: 'from-purple-500/20 to-violet-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40',
    totalLessons: 3,
    completedLessons: 0
  }
];

export const CURRICULUM_LESSONS: LearningLesson[] = [
  {
    id: 'lesson_day_1',
    trackId: 'isl-foundations',
    dayNumber: 1,
    title: 'Lesson 1: Greetings & Indian Etiquette',
    subtitle: 'Learn Namaste, Hello, Thank You, and Welcome in ISL',
    description: 'Start your journey with respectful Indian Sign Language greetings. Understand two-handed palms-pressed postures and polite contact motions.',
    durationMin: 8,
    xpReward: 120,
    difficulty: 'beginner',
    signLanguage: 'ISL',
    culturalFact: 'In ISL, Namaste (नमस्ते) is performed by joining both open palms together near the chest with a slight nod of respect, honoring universal equality.',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_greet_namaste',
        char: 'NAMASTE',
        hindiChar: 'नमस्ते',
        englishTitle: 'Namaste / Traditional Greeting',
        meaning: 'Respectful greeting expressing "I bow to the divine within you"',
        visualTip: 'Both flat palms pressed symmetrically against each other in front of the chest with a slight polite head nod.',
        description: 'Bring both hands together with fingers extended vertically and palms flat touching. Hold steadily near the sternum.',
        steps: [
          'Bring both hands to chest level simultaneously.',
          'Press all 5 fingers and palms of both hands together flat vertically (Anjali Mudra).',
          'Slightly bow head forward with a respectful facial expression.'
        ],
        isTwoHanded: true,
        culturalNote: 'Universal throughout India, used across all formal and informal settings.',
        difficulty: 'easy'
      },
      {
        id: 'isl_greet_hello',
        char: 'HELLO',
        hindiChar: 'नमस्ते / हेलो',
        englishTitle: 'Hello / Informal Greeting',
        meaning: 'Casual or introductory greeting to attract attention or start speaking',
        visualTip: 'Open flat dominant palm waves gently outward near temple height with a welcoming smile.',
        description: 'Raise dominant hand near shoulder or ear height, palm facing listener, and make a gentle lateral wave.',
        steps: [
          'Raise dominant hand to shoulder height.',
          'Face palm toward the viewer.',
          'Oscillate hand slightly side-to-side 2 times with a welcoming smile.'
        ],
        isTwoHanded: false,
        culturalNote: 'Widely understood across modern Indian youth and deaf community hubs.',
        difficulty: 'easy'
      },
      {
        id: 'isl_greet_dhanyavaad',
        char: 'THANK YOU',
        hindiChar: 'धन्यवाद / शुक्रिया',
        englishTitle: 'Thank You / Gratitude',
        meaning: 'Expressing sincere appreciation and gratitude',
        visualTip: 'Fingertips of flat dominant hand touch chin/lips then smoothly open forward toward the recipient.',
        description: 'Touch fingers of open dominant hand gently to chin or lower lip, then sweep hand forward toward the person.',
        steps: [
          'Place fingertips of flat dominant hand against chin or lower lip.',
          'Move hand forward and slightly downward toward the listener.',
          'Maintain an appreciative, smiling facial expression.'
        ],
        isTwoHanded: false,
        culturalNote: 'Common in educational and everyday deaf gatherings across Delhi, Mumbai, and Bangalore.',
        difficulty: 'easy'
      },
      {
        id: 'isl_greet_welcome',
        char: 'WELCOME',
        hindiChar: 'स्वागत है',
        englishTitle: 'Welcome / You are welcome',
        meaning: 'Inviting someone warmly into a space or responding to thanks',
        visualTip: 'Both open hands sweep inward in an embracing arc toward your chest.',
        description: 'Extend both open palms outward at waist height, palms facing up/inward, and sweep them in an inviting arc.',
        steps: [
          'Hold both open hands outward in front of body, palms up.',
          'Draw both hands smoothly inward toward your torso in a welcoming gesture.',
          'Warmly nod your head.'
        ],
        isTwoHanded: true,
        culturalNote: 'Representing traditional Indian hospitality (Atithi Devo Bhava).',
        difficulty: 'medium'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d1_1',
        question: 'How is the traditional ISL sign for "Namaste" performed?',
        options: [
          'Waving one hand at forehead height',
          'Pressing both palms flat together in front of the chest with a polite head nod',
          'Tapping the index finger to the chin',
          'Making a fist with thumb extended upward'
        ],
        correctIndex: 1,
        explanation: 'ISL Namaste joins both flat palms together near the chest in Anjali Mudra with a slight polite nod.',
        signChar: 'NAMASTE'
      },
      {
        id: 'q_d1_2',
        question: 'When signing "Thank You" in ISL, where does the dominant hand begin?',
        options: [
          'On top of the head',
          'At the chin or lower lip moving forward toward the listener',
          'Behind the back',
          'At the stomach rubbing in circles'
        ],
        correctIndex: 1,
        explanation: 'Fingertips start gently touching the chin/lower lip and sweep forward toward the other person.',
        signChar: 'THANK YOU'
      },
      {
        id: 'q_d1_3',
        question: 'Is "Welcome" typically performed with one hand or two hands in ISL?',
        options: [
          'Two hands sweeping inward in an embracing hospitable motion',
          'Only one pinky finger pointing up',
          'Strictly no hands, only head gestures',
          'One hand clenched in a tight fist'
        ],
        correctIndex: 0,
        explanation: 'Both open hands sweep inward toward the chest to convey warmth and hospitality.',
        signChar: 'WELCOME'
      }
    ]
  },
  {
    id: 'lesson_day_2',
    trackId: 'isl-foundations',
    dayNumber: 2,
    title: 'Lesson 2: ISL Two-Handed Vowels (A, E, I, O, U)',
    subtitle: 'The iconic 5 fingertip touch postures that form the basis of ISL spelling',
    description: 'Indian Sign Language uses a unique British/Indo-Pakistani two-handed manual alphabet. Learn how the dominant index finger touches each non-dominant fingertip to spell vowels.',
    durationMin: 10,
    xpReward: 150,
    difficulty: 'beginner',
    signLanguage: 'ISL',
    culturalFact: 'In ISL fingerspelling, the non-dominant hand acts as a "canvas" or chart with 5 fingers representing A (Thumb), E (Index), I (Middle), O (Ring), and U (Pinky)!',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_vowel_a',
        char: 'A',
        hindiChar: 'ए',
        englishTitle: 'ISL Letter A (Thumb Touch)',
        meaning: 'First vowel in ISL manual alphabet',
        visualTip: 'Dominant index finger touches the tip of the non-dominant outstretched thumb.',
        description: 'Hold non-dominant hand open with fingers spread. Point dominant index finger and touch the non-dominant thumb tip.',
        steps: [
          'Hold non-dominant hand open facing forward.',
          'Point dominant index finger.',
          'Touch the tip of non-dominant thumb clearly.'
        ],
        isTwoHanded: true,
        difficulty: 'easy'
      },
      {
        id: 'isl_vowel_e',
        char: 'E',
        hindiChar: 'ई',
        englishTitle: 'ISL Letter E (Index Touch)',
        meaning: 'Second vowel in ISL manual alphabet',
        visualTip: 'Dominant index finger touches the tip of the non-dominant index finger.',
        description: 'Touch the tip of your dominant index finger directly onto the tip of the non-dominant index finger.',
        steps: [
          'Non-dominant hand open with fingers upright.',
          'Touch dominant index tip to non-dominant index fingertip.'
        ],
        isTwoHanded: true,
        difficulty: 'easy'
      },
      {
        id: 'isl_vowel_i',
        char: 'I',
        hindiChar: 'आई',
        englishTitle: 'ISL Letter I (Middle Touch)',
        meaning: 'Third vowel in ISL manual alphabet',
        visualTip: 'Dominant index finger touches the tip of the non-dominant middle finger.',
        description: 'Touch the tip of your dominant index finger to the tall middle finger of the non-dominant hand.',
        steps: [
          'Non-dominant hand open in neutral base.',
          'Touch dominant index tip to non-dominant middle fingertip.'
        ],
        isTwoHanded: true,
        difficulty: 'easy'
      },
      {
        id: 'isl_vowel_o',
        char: 'O',
        hindiChar: 'ओ',
        englishTitle: 'ISL Letter O (Ring Touch)',
        meaning: 'Fourth vowel in ISL manual alphabet',
        visualTip: 'Dominant index finger touches the tip of the non-dominant ring finger.',
        description: 'Touch the tip of your dominant index finger to the non-dominant ring fingertip.',
        steps: [
          'Non-dominant hand open.',
          'Target the ring finger with dominant index finger.'
        ],
        isTwoHanded: true,
        difficulty: 'easy'
      },
      {
        id: 'isl_vowel_u',
        char: 'U',
        hindiChar: 'यू',
        englishTitle: 'ISL Letter U (Pinky Touch)',
        meaning: 'Fifth vowel in ISL manual alphabet',
        visualTip: 'Dominant index finger touches the tip of the non-dominant pinky finger.',
        description: 'Touch dominant index finger tip to the smallest pinky finger of the non-dominant hand.',
        steps: [
          'Non-dominant hand open.',
          'Touch dominant index tip to non-dominant pinky fingertip.'
        ],
        isTwoHanded: true,
        difficulty: 'easy'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d2_1',
        question: 'Which finger on the base hand represents the vowel "A" in ISL?',
        options: ['Pinky finger', 'Thumb tip', 'Middle finger', 'Ring finger'],
        correctIndex: 1,
        explanation: 'In the ISL vowel system, the thumb is A, index is E, middle is I, ring is O, and pinky is U.',
        signChar: 'A'
      },
      {
        id: 'q_d2_2',
        question: 'To sign the letter "I" in ISL, which fingertip is touched?',
        options: ['Thumb', 'Middle finger tip', 'Index finger tip', 'Wrist'],
        correctIndex: 1,
        explanation: 'Touching the middle fingertip with the dominant index finger spells the letter "I".',
        signChar: 'I'
      }
    ]
  },
  {
    id: 'lesson_day_3',
    trackId: 'isl-foundations',
    dayNumber: 3,
    title: 'Lesson 3: Numbers 1 through 10 & Counting in ISL',
    subtitle: 'Master single and dual hand counting postures used across India',
    description: 'Learn clear digit representations for counting 1 to 10. Learn the subtle difference between ASL numbers and ISL palm orientations.',
    durationMin: 12,
    xpReward: 160,
    difficulty: 'beginner',
    signLanguage: 'ISL',
    culturalFact: 'In Indian markets and everyday deaf communication, clear palm facing and thumb positioning prevent numeric ambiguities.',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_num_1',
        char: '1',
        hindiChar: '१ (एक)',
        englishTitle: 'Number 1 (Ek)',
        meaning: 'Digit 1 in ISL counting',
        visualTip: 'Index finger straight up, other fingers curled into fist with thumb holding them.',
        description: 'Single index finger extended upright with palm facing forward.',
        steps: ['Extend index finger vertically.', 'Curl thumb over middle, ring, pinky fingers.'],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_num_5',
        char: '5',
        hindiChar: '५ (पाँच)',
        englishTitle: 'Number 5 (Paanch)',
        meaning: 'Digit 5 in ISL counting',
        visualTip: 'All 5 fingers fully extended and spread wide.',
        description: 'Open hand with all 5 digits spread apart clearly facing forward.',
        steps: ['Extend all five fingers flat and spread evenly.', 'Palm facing forward towards audience.'],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_num_10',
        char: '10',
        hindiChar: '१० (दस)',
        englishTitle: 'Number 10 (Dus)',
        meaning: 'Digit 10 in ISL counting',
        visualTip: 'Both open hands extended showing all 10 fingers or shaking thumbs up.',
        description: 'Present both hands open showing 5 + 5 = 10 fingers clearly side by side.',
        steps: ['Raise both open hands at chest level.', 'Show all 10 fingers spread symmetrically.'],
        isTwoHanded: true,
        difficulty: 'easy'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d3_1',
        question: 'How is number 10 signed using both hands in ISL?',
        options: [
          'Showing both open hands with all 10 fingers spread (5 + 5)',
          'Tapping one elbow twice',
          'Closing both hands in fists',
          'Pointing behind the ear'
        ],
        correctIndex: 0,
        explanation: 'Number 10 is signed by presenting both hands with all 5 fingers spread simultaneously.',
        signChar: '10'
      }
    ]
  },
  {
    id: 'lesson_day_4',
    trackId: 'isl-foundations',
    dayNumber: 4,
    title: 'Lesson 4: Polite Requests & Key Phrases',
    subtitle: 'Learn Please, Sorry, Yes, No, and Help in ISL',
    description: 'Essential conversational building blocks that enable seamless polite interactions in Indian Sign Language.',
    durationMin: 10,
    xpReward: 140,
    difficulty: 'beginner',
    signLanguage: 'ISL',
    culturalFact: 'Facial expressions (non-manual markers) are grammatical in ISL: an apologetic brow and soft nod reinforce "Sorry" (माफ़ कीजिए).',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_phrase_please',
        char: 'PLEASE',
        hindiChar: 'कृपया',
        englishTitle: 'Please / Polite Request',
        meaning: 'Polite preface to any request or plea',
        visualTip: 'Flat open palm rubs in a gentle circular motion over the heart/chest.',
        description: 'Place dominant palm flat against the center of the chest and make 2 circular clockwise rubs.',
        steps: [
          'Place flat right palm over center chest.',
          'Rotate hand in small clockwise circles smoothly.',
          'Maintain a gentle, respectful facial expression.'
        ],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_phrase_sorry',
        char: 'SORRY',
        hindiChar: 'माफ़ कीजिए',
        englishTitle: 'Sorry / Apology',
        meaning: 'Expressing apology, regret, or sympathy',
        visualTip: 'Closed fist with thumb upright rubs gently over the chest in a circular motion with apologetic eyes.',
        description: 'Make a fist with dominant hand and rub the knuckles against chest in small circles.',
        steps: [
          'Form a loose fist with dominant hand.',
          'Rub knuckles against chest in circular motion.',
          'Show an apologetic, gentle facial expression.'
        ],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_phrase_yes',
        char: 'YES',
        hindiChar: 'हाँ',
        englishTitle: 'Yes / Agreement',
        meaning: 'Affirmative response or agreement',
        visualTip: 'Closed fist nods up and down vertically mimicking a nodding head.',
        description: 'Hold a closed fist at shoulder height and flex wrist up and down 2 times like a nodding head.',
        steps: ['Hold fist upright at shoulder level.', 'Tilt fist forward and back at wrist joint.'],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_phrase_no',
        char: 'NO',
        hindiChar: 'नहीं',
        englishTitle: 'No / Disagreement',
        meaning: 'Negative response or decline',
        visualTip: 'Index and middle fingers snap down against thumb or flat palm waves laterally.',
        description: 'Bring index and middle tips to snap downward against thumb while gently shaking head.',
        steps: ['Extend index and middle fingers.', 'Snap them down against thumb tip while shaking head "no".'],
        isTwoHanded: false,
        difficulty: 'easy'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d4_1',
        question: 'What hand motion represents "Sorry" in sign language?',
        options: [
          'Fist rubbing in circles over the chest with an apologetic expression',
          'Snapping fingers in the air',
          'Waving both hands over the head',
          'Pointing at both knees'
        ],
        correctIndex: 0,
        explanation: 'A fist rubbing circular patterns over the chest conveys heartfelt apology in both ISL and ASL.',
        signChar: 'SORRY'
      }
    ]
  },
  {
    id: 'lesson_day_5',
    trackId: 'isl-conversation',
    dayNumber: 5,
    title: 'Lesson 5: Family & Relationships in ISL',
    subtitle: 'Father, Mother, Brother, Sister, and Friend',
    description: 'Learn foundational signs to describe your family tree and social connections in Indian culture.',
    durationMin: 12,
    xpReward: 160,
    difficulty: 'intermediate',
    signLanguage: 'ISL',
    culturalFact: 'In ISL, traditional signs for Mother and Father incorporate cultural markers such as bindi touch or traditional mustache stroke!',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_fam_mother',
        char: 'MOTHER',
        hindiChar: 'माँ / माताजी',
        englishTitle: 'Mother (Maa / Amma)',
        meaning: 'Female parent, honoring motherhood',
        visualTip: 'Dominant thumb touches chin or forehead bindi location, or open hand strokes cheek.',
        description: 'Touch thumb of open 5-hand to chin or temple with a warm smile.',
        steps: ['Touch thumb to chin or mid-forehead.', 'Open palm flat facing side.'],
        isTwoHanded: false,
        difficulty: 'medium'
      },
      {
        id: 'isl_fam_father',
        char: 'FATHER',
        hindiChar: 'पिताजी / पापा',
        englishTitle: 'Father (Pitaji / Appa)',
        meaning: 'Male parent',
        visualTip: 'Dominant thumb touches upper forehead, or index/thumb mimics mustache stroke.',
        description: 'Stroke index and thumb across upper lip or touch thumb to forehead.',
        steps: ['Place thumb near side of forehead or upper lip.', 'Extend hand outward with firm posture.'],
        isTwoHanded: false,
        difficulty: 'medium'
      },
      {
        id: 'isl_fam_friend',
        char: 'FRIEND',
        hindiChar: 'दोस्त / मित्र',
        englishTitle: 'Friend (Dost / Mitra)',
        meaning: 'Close companion or buddy',
        visualTip: 'Both index fingers hook into each other once and reverse hook.',
        description: 'Hook dominant index over non-dominant index finger, then flip and hook in reverse.',
        steps: ['Hook right index over left index.', 'Flip and hook left index over right index.'],
        isTwoHanded: true,
        difficulty: 'medium'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d5_1',
        question: 'How do you sign "Friend" using both index fingers?',
        options: [
          'Hook both index fingers together and flip to interlock',
          'Touch index finger to the nose',
          'Clap hands loudly 3 times',
          'Wave one index finger side to side'
        ],
        correctIndex: 0,
        explanation: 'Hooking both index fingers together symbolizes an unbreakable bond between friends.',
        signChar: 'FRIEND'
      }
    ]
  },
  {
    id: 'lesson_day_6',
    trackId: 'isl-conversation',
    dayNumber: 6,
    title: 'Lesson 6: Indian Food & Dining Signs',
    subtitle: 'Chai (Tea), Water (Pani), Food (Khana), and Rice',
    description: 'Learn everyday vocabulary for ordering food, drinking tea, asking for water, and enjoying meals in India.',
    durationMin: 10,
    xpReward: 140,
    difficulty: 'intermediate',
    signLanguage: 'ISL',
    culturalFact: 'Chai is universally signed by miming holding a small saucer and cup and sipping with delight!',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_food_chai',
        char: 'CHAI / TEA',
        hindiChar: 'चाय',
        englishTitle: 'Chai / Tea',
        meaning: 'Traditional spiced Indian tea',
        visualTip: 'Hold imaginary small tea cup by the rim with thumb and index and bring to lips.',
        description: 'Form a C or pinch shape near lips and tilt upwards as if sipping hot fragrant chai.',
        steps: ['Pinch thumb and index like holding small cup handle.', 'Tilt toward mouth with a pleasant expression.'],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_food_water',
        char: 'WATER',
        hindiChar: 'पानी',
        englishTitle: 'Water (Pani / Neeru)',
        meaning: 'Drinking water',
        visualTip: 'Three middle fingers form "W" or curved hand tilts water toward open mouth.',
        description: 'Tap index finger on chin or tilt cupped hand toward mouth mimicking drinking fresh water.',
        steps: ['Hold hand near mouth with fingertips cupped.', 'Tilt hand inward toward lips.'],
        isTwoHanded: false,
        difficulty: 'easy'
      },
      {
        id: 'isl_food_food',
        char: 'FOOD / EAT',
        hindiChar: 'खाना / भोजन',
        englishTitle: 'Food / To Eat (Khana)',
        meaning: 'Meal, breakfast, lunch, or dinner',
        visualTip: 'All fingertips brought together in a cone shape and tapped toward the mouth twice.',
        description: 'Gather fingertips together (squished O-hand) and tap lightly near mouth twice.',
        steps: ['Bring all fingertips of dominant hand to touch thumb tip.', 'Tap gently towards mouth 2 times.'],
        isTwoHanded: false,
        difficulty: 'easy'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d6_1',
        question: 'What is the handshape for signing "Food / Eat" in ISL?',
        options: [
          'All fingertips brought together in a cone shape tapped twice toward the mouth',
          'An open fist pointing down',
          'Two index fingers pointing at ears',
          'Tapping the chest with both wrists'
        ],
        correctIndex: 0,
        explanation: 'Fingertips gathered together mimicking carrying food to the mouth is the universal sign for Food/Eat.',
        signChar: 'FOOD / EAT'
      }
    ]
  },
  {
    id: 'lesson_day_7',
    trackId: 'emergency-health',
    dayNumber: 7,
    title: 'Lesson 7: Emergency, Medical & Doctor Signs',
    subtitle: 'Doctor, Hospital, Medicine, Pain, and Urgent Help',
    description: 'Lifesaving signs for medical scenarios, explaining pain locations, and summoning immediate aid.',
    durationMin: 12,
    xpReward: 180,
    difficulty: 'intermediate',
    signLanguage: 'BOTH',
    culturalFact: 'In emergency situations, combining the sign for "Doctor" with urgent facial markers alerts responders instantly.',
    completed: false,
    unlocked: true,
    signs: [
      {
        id: 'isl_health_doctor',
        char: 'DOCTOR',
        hindiChar: 'डॉक्टर / चिकित्सक',
        englishTitle: 'Doctor / Physician',
        meaning: 'Medical professional or physician',
        visualTip: 'Dominant index and middle fingertips tap the non-dominant wrist (checking pulse).',
        description: 'Hold non-dominant wrist with palm up. Tap dominant index and middle finger onto the radial pulse spot twice.',
        steps: ['Hold left arm out, wrist facing up.', 'Tap right index and middle finger tips on the pulse area twice.'],
        isTwoHanded: true,
        difficulty: 'medium'
      },
      {
        id: 'isl_health_help',
        char: 'HELP',
        hindiChar: 'मदद / सहायता',
        englishTitle: 'Help / Assistance',
        meaning: 'Requesting or offering assistance',
        visualTip: 'Thumbs-up fist resting on flat base palm lifted upward together.',
        description: 'Place closed dominant fist with thumb up flat onto open non-dominant palm, and raise both hands together.',
        steps: ['Place left hand flat palm-up at waist.', 'Set right fist (thumbs up) onto left palm.', 'Lift both hands upward smoothly.'],
        isTwoHanded: true,
        difficulty: 'hard'
      },
      {
        id: 'isl_health_medicine',
        char: 'MEDICINE',
        hindiChar: 'दवाई / औषधि',
        englishTitle: 'Medicine / Tablet',
        meaning: 'Prescription medication or pills',
        visualTip: 'Middle finger rocks in circular motion in center of open palm (crushing medicine in mortar).',
        description: 'Extend middle finger into the center of the non-dominant open palm and twist side to side.',
        steps: ['Left hand open flat, palm facing up.', 'Touch right middle finger tip to left palm center and twist lightly.'],
        isTwoHanded: true,
        difficulty: 'medium'
      }
    ],
    quizQuestions: [
      {
        id: 'q_d7_1',
        question: 'Why does the sign for "Doctor" involve tapping the inner wrist?',
        options: [
          'It mimics checking a patient\'s radial pulse',
          'It represents checking a wristwatch',
          'It means wearing a bracelet',
          'It signifies waving goodbye'
        ],
        correctIndex: 0,
        explanation: 'Tapping the inner wrist mimics the classical physician act of feeling the radial pulse.',
        signChar: 'DOCTOR'
      }
    ]
  }
];

export const INITIAL_PRACTICE_GOALS: PracticeGoal[] = [
  {
    id: 'goal_daily_signs',
    title: 'Daily Sign Practice',
    description: 'Practice and verify at least 5 different sign postures today',
    type: 'daily_signs',
    targetValue: 5,
    currentValue: 3,
    unit: 'signs',
    period: 'daily',
    isCompleted: false,
    xpReward: 50,
    iconName: 'Target'
  },
  {
    id: 'goal_daily_time',
    title: 'Active Practice Time',
    description: 'Spend 10 minutes practicing sign posture alignments',
    type: 'daily_time',
    targetValue: 10,
    currentValue: 8,
    unit: 'mins',
    period: 'daily',
    isCompleted: false,
    xpReward: 60,
    iconName: 'Clock'
  },
  {
    id: 'goal_daily_accuracy',
    title: 'High Accuracy Target',
    description: 'Achieve an average posture accuracy of 85% or higher',
    type: 'daily_accuracy',
    targetValue: 85,
    currentValue: 92,
    unit: '%',
    period: 'daily',
    isCompleted: true,
    xpReward: 75,
    iconName: 'Zap'
  },
  {
    id: 'goal_weekly_lessons',
    title: 'Weekly Lesson Master',
    description: 'Complete 4 structured daily lessons this week',
    type: 'weekly_lessons',
    targetValue: 4,
    currentValue: 2,
    unit: 'lessons',
    period: 'weekly',
    isCompleted: false,
    xpReward: 200,
    iconName: 'BookOpen'
  },
  {
    id: 'goal_weekly_xp',
    title: 'XP Milestone Challenge',
    description: 'Earn 500 total XP points across quizzes and webcam sessions',
    type: 'weekly_xp',
    targetValue: 500,
    currentValue: 380,
    unit: 'XP',
    period: 'weekly',
    isCompleted: false,
    xpReward: 150,
    iconName: 'Sparkles'
  }
];

export const ALL_COMPLETION_BADGES: CompletionBadge[] = [
  {
    id: 'badge_first_steps',
    title: 'First Steps',
    description: 'Completed your very first sign language lesson',
    category: 'curriculum',
    icon: '🌱',
    tier: 'bronze',
    requirement: 'Complete 1 lesson',
    currentProgress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: '2026-08-10T14:30:00Z',
    xpValue: 50,
    flavorText: 'Every grand journey in sign language starts with a single open hand.'
  },
  {
    id: 'badge_namaste_master',
    title: 'Namaste ISL Pioneer',
    description: 'Mastered traditional Indian greetings and polite etiquette',
    category: 'culture',
    icon: '🙏',
    tier: 'bronze',
    requirement: 'Score 100% in Lesson 1: Greetings',
    currentProgress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: '2026-08-11T09:15:00Z',
    xpValue: 75,
    flavorText: 'Atithi Devo Bhava — honoring every interaction with warmth.'
  },
  {
    id: 'badge_vowel_virtuoso',
    title: 'Vowel Virtuoso',
    description: 'Mastered all 5 two-handed ISL vowels (A, E, I, O, U)',
    category: 'mastery',
    icon: '🔤',
    tier: 'silver',
    requirement: 'Complete Lesson 2: Two-Handed Vowels',
    currentProgress: 5,
    maxProgress: 5,
    unlocked: true,
    unlockedAt: '2026-08-12T16:45:00Z',
    xpValue: 120,
    flavorText: 'Your fingers move across the base hand like keys on an instrument.'
  },
  {
    id: 'badge_streak_7',
    title: '7-Day Streak Warrior',
    description: 'Maintained a consistent daily practice streak for 7 full days',
    category: 'streak',
    icon: '🔥',
    tier: 'silver',
    requirement: 'Practice 7 consecutive days',
    currentProgress: 5,
    maxProgress: 7,
    unlocked: false,
    xpValue: 200,
    flavorText: 'Consistency is the secret spark that turns curiosity into fluency.'
  },
  {
    id: 'badge_number_navigator',
    title: 'Number Navigator',
    description: 'Counted fluently from 0 to 10 in Indian Sign Language',
    category: 'mastery',
    icon: '🔢',
    tier: 'silver',
    requirement: 'Master 10 numeric signs',
    currentProgress: 10,
    maxProgress: 10,
    unlocked: true,
    unlockedAt: '2026-08-13T11:20:00Z',
    xpValue: 150,
    flavorText: 'Ready for market haggling, train bookings, and time references!'
  },
  {
    id: 'badge_accuracy_sharpshooter',
    title: 'Precision Sharpshooter',
    description: 'Achieved 95%+ posture accuracy during a camera practice session',
    category: 'accuracy',
    icon: '🎯',
    tier: 'gold',
    requirement: 'Score 95%+ in real-time camera tracking',
    currentProgress: 96,
    maxProgress: 100,
    unlocked: true,
    unlockedAt: '2026-08-14T18:05:00Z',
    xpValue: 250,
    flavorText: 'Flawless finger angle, zero rotation drift, optical perfection.'
  },
  {
    id: 'badge_emergency_hero',
    title: 'Emergency Ready',
    description: 'Mastered all critical Health, Hospital, Doctor, and Help signs',
    category: 'curriculum',
    icon: '🏥',
    tier: 'gold',
    requirement: 'Complete Health & Emergency Track',
    currentProgress: 3,
    maxProgress: 3,
    unlocked: false,
    xpValue: 300,
    flavorText: 'Knowledge that can bridge silence and save lives in critical moments.'
  },
  {
    id: 'badge_vocabulary_50',
    title: 'Vocabulary Maestro (50+)',
    description: 'Learned and practiced over 50 distinct ISL and ASL vocabulary signs',
    category: 'mastery',
    icon: '🏆',
    tier: 'gold',
    requirement: 'Master 50 total signs',
    currentProgress: 34,
    maxProgress: 50,
    unlocked: false,
    xpValue: 400,
    flavorText: 'You can now hold continuous conversations with deaf friends.'
  },
  {
    id: 'badge_isl_grandmaster',
    title: 'ISL Grandmaster',
    description: 'Achieved Level 10 and completed all foundational curriculum tracks',
    category: 'mastery',
    icon: '👑',
    tier: 'diamond',
    requirement: 'Reach Level 10 & 2000 XP',
    currentProgress: 1450,
    maxProgress: 2000,
    unlocked: false,
    xpValue: 1000,
    flavorText: 'The summit of mastery — an ambassador for inclusive communication.'
  },
  {
    id: 'badge_speed_scholar',
    title: 'Speed Scholar',
    description: 'Completed 3 full lessons with perfect scores in a single day',
    category: 'speed',
    icon: '⚡',
    tier: 'silver',
    requirement: '3 perfect lessons in 24 hours',
    currentProgress: 2,
    maxProgress: 3,
    unlocked: false,
    xpValue: 180,
    flavorText: 'Lightning fast comprehension with laser focus.'
  },
  {
    id: 'badge_culture_ambassador',
    title: 'Cultural Ambassador',
    description: 'Explored cultural nuances across 10 Indian states & sign dialects',
    category: 'culture',
    icon: '🇮🇳',
    tier: 'gold',
    requirement: 'Complete 10 cultural sign modules',
    currentProgress: 7,
    maxProgress: 10,
    unlocked: false,
    xpValue: 350,
    flavorText: 'Bridging linguistic diversity across the subcontinent.'
  },
  {
    id: 'badge_streak_30',
    title: '30-Day Immortal Legend',
    description: 'Maintained a flawless 30-day unbroken practice streak',
    category: 'streak',
    icon: '💎',
    tier: 'diamond',
    requirement: '30-day continuous streak',
    currentProgress: 5,
    maxProgress: 30,
    unlocked: false,
    xpValue: 1200,
    flavorText: 'A month of dedication that creates lifelong muscle memory.'
  }
];
