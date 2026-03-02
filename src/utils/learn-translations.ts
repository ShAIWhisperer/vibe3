// Translations for Learn Mode

export type Language = 'en' | 'he' | 'ru' | 'ar' | 'es';

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
  ar: 'العربية',
  es: 'Español'
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇺🇸',
  he: '🇮🇱',
  ru: '🇷🇺',
  ar: '🇸🇦',
  es: '🇪🇸'
};

// RTL languages
export const RTL_LANGUAGES: Language[] = ['he', 'ar'];

export const isRTL = (lang: Language) => RTL_LANGUAGES.includes(lang);

export interface TranslatedLesson {
  title: string;
  description: string;
  steps: {
    title: string;
    content: string;
    tip?: string;
  }[];
  challenge?: {
    description: string;
    goal: string;
  };
}

export interface Translations {
  // UI strings
  ui: {
    title: string;
    subtitle: string;
    backToLessons: string;
    previous: string;
    next: string;
    complete: string;
    stepOf: string;
    progress: string;
    welcome: string;
    welcomeMessage: string;
    proTip: string;
    challenge: string;
    goal: string;
    tryIt: string;
    steps: string;
  };
  // Lessons
  lessons: Record<string, TranslatedLesson>;
}

export const translations: Record<Language, Translations> = {
  en: {
    ui: {
      title: 'Sound Design Academy',
      subtitle: 'Learn the art of synthesis',
      backToLessons: 'Back to lessons',
      previous: 'Previous',
      next: 'Next',
      complete: 'Complete',
      stepOf: 'Step {current} of {total}',
      progress: 'Progress',
      welcome: 'Welcome, Sound Explorer!',
      welcomeMessage: 'Ready to fall in love with synthesis? Each lesson teaches a fundamental concept with hands-on exercises. Experiment with the controls while learning!',
      proTip: 'Pro Tip',
      challenge: 'Challenge!',
      goal: 'Goal',
      tryIt: 'Try it now!',
      steps: 'steps'
    },
    lessons: {
      oscillators: {
        title: 'Oscillators',
        description: 'The source of all sound',
        steps: [
          {
            title: 'What is an Oscillator?',
            content: 'An oscillator generates the raw sound wave. Think of it like a vibrating guitar string - but electronic!',
            tip: '🎸 Real instruments vibrate air. Synths vibrate electrons!'
          },
          {
            title: 'Sawtooth Wave',
            content: 'The SAW wave sounds bright and buzzy - like a violin. It contains ALL harmonics, making it rich and full. This is the classic acid sound!',
            tip: '🎻 Sawtooth = Rich & Aggressive'
          },
          {
            title: 'Pulse Wave',
            content: 'The PULSE wave sounds hollow and woody - like a clarinet. It only has ODD harmonics, giving it a different character.',
            tip: '🎺 Pulse = Hollow & Punchy'
          },
          {
            title: 'Try It!',
            content: 'Toggle between SAW and PULSE. Listen to how different they sound playing the same notes!',
            tip: '👂 Close your eyes and really LISTEN'
          }
        ],
        challenge: {
          description: 'Switch waveforms while playing',
          goal: 'Notice how SAW sounds brighter than PULSE'
        }
      },
      filters: {
        title: 'Filters',
        description: 'Sculpt your sound',
        steps: [
          {
            title: 'What is a Filter?',
            content: 'A filter removes frequencies. The TB-303 uses a LOW-PASS filter - letting low frequencies through while cutting highs.',
            tip: '🔊 Like putting your hand over a speaker!'
          },
          {
            title: 'The Cutoff Knob',
            content: 'CUTOFF controls WHERE the filter cuts. Low = dark, muffled. High = bright, cutting. This is the most important knob!',
            tip: '🎛️ Cutoff is your best friend!'
          },
          {
            title: 'Sweep the Filter',
            content: 'Slowly turn CUTOFF from 0 to 100% while playing. Hear how the sound changes? That\'s filtering!',
            tip: '✨ This sweeping IS the acid sound!'
          },
          {
            title: 'The Sweet Spot',
            content: 'Classic acid lives between 20-50% cutoff. Too low = mud. Too high = harsh. Trust your ears!',
            tip: '🎯 Automate cutoff for movement!'
          }
        ],
        challenge: {
          description: 'Sweep cutoff while playing',
          goal: 'Find a cutoff setting you love'
        }
      },
      resonance: {
        title: 'Resonance',
        description: 'Add the squelch',
        steps: [
          {
            title: 'What is Resonance?',
            content: 'Resonance BOOSTS frequencies at the cutoff point. It makes the filter "ring" - that\'s the signature acid squelch!',
            tip: '🔔 Resonance = Filter feedback = SQUELCH!'
          },
          {
            title: 'Low Resonance',
            content: 'At 0-30%, the filter is smooth and subtle. Good for warm basses and gentle leads.',
            tip: '😌 Low reso = Smooth & Musical'
          },
          {
            title: 'High Resonance',
            content: 'Above 60%, things get WILD! The filter starts to sing, scream, and squelch. Pure acid territory!',
            tip: '🔥 High reso = Screaming Acid!'
          },
          {
            title: 'The Sweet Spot',
            content: 'Try resonance 50-70% with cutoff 30-40%. Play with both together - this is where magic happens!',
            tip: '✨ Cutoff + Resonance = Your signature'
          }
        ],
        challenge: {
          description: 'High resonance + sweep cutoff',
          goal: 'Create that classic squelch'
        }
      },
      envelopes: {
        title: 'Envelopes',
        description: 'Shape sound over time',
        steps: [
          {
            title: 'What is an Envelope?',
            content: 'An envelope controls how a parameter changes over time. In the TB-303, it creates that distinctive "wah" attack!',
            tip: '📈 Envelopes add LIFE to static sounds'
          },
          {
            title: 'Envelope Modulation',
            content: 'ENV MOD controls how much the envelope affects the filter. High = dramatic sweep. Low = subtle movement.',
            tip: '💥 High Env Mod = Punchy attacks!'
          },
          {
            title: 'Decay Time',
            content: 'DECAY controls how long the envelope falls. Short = quick "blip". Long = slow "waaah".',
            tip: '⏱️ Fast = Rhythmic. Slow = Flowing'
          },
          {
            title: 'The Combo',
            content: 'Set Cutoff low (30%), Env Mod high (60%), Decay medium (40%). Each note "opens" the filter - classic acid!',
            tip: '🎹 This defined acid house!'
          }
        ],
        challenge: {
          description: 'Low cutoff + High env mod',
          goal: 'Create punchy, percussive notes'
        }
      },
      accents: {
        title: 'Accents',
        description: 'Add emphasis',
        steps: [
          {
            title: 'What are Accents?',
            content: 'Accents make certain notes LOUDER and BRIGHTER. They add dynamics and groove - making patterns feel alive!',
            tip: '🥁 Accents create rhythm!'
          },
          {
            title: 'The Accent Knob',
            content: 'Controls how much louder/brighter accented notes are. Higher = more dramatic difference.',
            tip: '💪 Strong accents = Punchy groove!'
          },
          {
            title: 'Adding Accents',
            content: 'In the step editor, toggle "A" to accent notes. Try accenting beat 1 of each bar, or off-beats for funk!',
            tip: '🎵 Accent every 4th or 8th note'
          },
          {
            title: 'Accent + Resonance',
            content: 'Accents also boost resonance! High accent + high resonance = screaming, squelchy hits. Secret sauce!',
            tip: '🔥 Accented notes SCREAM!'
          }
        ],
        challenge: {
          description: 'Add accents on beats 1 and 3',
          goal: 'Feel how accents create groove'
        }
      },
      slides: {
        title: 'Slides',
        description: 'Smooth glides',
        steps: [
          {
            title: 'What are Slides?',
            content: 'Slides make pitch GLIDE smoothly between notes instead of jumping. Like sliding your finger on a guitar!',
            tip: '🎸 Slides add expression'
          },
          {
            title: 'The 303 Slide',
            content: 'The 303\'s slide is special - it extends the note and keeps the filter open longer. Creates "squelchy slides"!',
            tip: '✨ 303 slides are legendary!'
          },
          {
            title: 'Adding Slides',
            content: 'Toggle "S" in the step editor. Slides between far-apart notes sound more dramatic!',
            tip: '🎵 Try low note → high note!'
          },
          {
            title: 'Slide + Accent',
            content: 'An accented slide is POWERFUL! The note glides in while screaming. Use sparingly for maximum impact!',
            tip: '💥 Accented slides = Secret weapon!'
          }
        ],
        challenge: {
          description: 'Slide between notes an octave apart',
          goal: 'Hear the smooth glide'
        }
      },
      modulation: {
        title: 'Modulation',
        description: 'Automatic movement',
        steps: [
          {
            title: 'What is an LFO?',
            content: 'LFO = Low Frequency Oscillator. Too slow to hear, but it MOVES parameters automatically - like a robot turning knobs!',
            tip: '🤖 LFOs add life automatically!'
          },
          {
            title: 'LFO Shapes',
            content: 'SINE = smooth waves. TRIANGLE = pointier. SQUARE = sudden jumps. RANDOM = chaos!',
            tip: '🌊 Sine for subtle, Square for rhythmic'
          },
          {
            title: 'Rate & Depth',
            content: 'RATE = speed. DEPTH = intensity. Start slow and subtle, then experiment!',
            tip: '🎛️ Fast rate + Low depth = Shimmer'
          },
          {
            title: 'Sync to Tempo',
            content: 'Click SYNC to lock LFO to tempo. Try 1/4 or 1/8 notes for rhythmic movement!',
            tip: '🔒 Synced LFOs sound musical!'
          }
        ],
        challenge: {
          description: 'Add slow sine LFO to cutoff',
          goal: 'Hear the filter breathe'
        }
      },
      automation: {
        title: 'Automation',
        description: 'Draw changes',
        steps: [
          {
            title: 'What is Automation?',
            content: 'Automation lets you DRAW how a parameter changes throughout your pattern. Like recording knob movements!',
            tip: '✏️ Your personal robot assistant!'
          },
          {
            title: 'Drawing',
            content: 'Switch to Automation view, select a parameter, and click/drag to draw. The synth follows perfectly!',
            tip: '🎨 Rising lines for builds!'
          },
          {
            title: 'Ideas',
            content: 'Try: Rising cutoff through pattern. Or: High decay at start, short at end. Get creative!',
            tip: '💡 Automation brings patterns to LIFE!'
          },
          {
            title: 'Combine All!',
            content: 'Use automation for big movements, LFOs for subtle wobble, and manual tweaks for performance!',
            tip: '🎭 Layers = Professional sound!'
          }
        ],
        challenge: {
          description: 'Draw rising cutoff automation',
          goal: 'Watch the filter follow your drawing'
        }
      }
    }
  },
  
  he: {
    ui: {
      title: 'אקדמיית עיצוב סאונד',
      subtitle: 'למדו את אמנות הסינתזה',
      backToLessons: 'חזרה לשיעורים',
      previous: 'הקודם',
      next: 'הבא',
      complete: 'סיום',
      stepOf: 'שלב {current} מתוך {total}',
      progress: 'התקדמות',
      welcome: 'ברוכים הבאים, חוקרי סאונד!',
      welcomeMessage: 'מוכנים להתאהב בסינתזה? כל שיעור מלמד קונספט בסיסי עם תרגול מעשי. נסו את הבקרים תוך כדי למידה!',
      proTip: 'טיפ מקצועי',
      challenge: 'אתגר!',
      goal: 'מטרה',
      tryIt: 'נסו עכשיו!',
      steps: 'שלבים'
    },
    lessons: {
      oscillators: {
        title: 'אוסילטורים',
        description: 'מקור כל הצליל',
        steps: [
          {
            title: 'מהו אוסילטור?',
            content: 'אוסילטור מייצר את גל הסאונד הגולמי. חשבו על זה כמו מיתר גיטרה רוטט - אבל אלקטרוני!',
            tip: '🎸 כלי נגינה אמיתיים מרטיטים אוויר. סינתים מרטיטים אלקטרונים!'
          },
          {
            title: 'גל שיניים',
            content: 'גל SAW נשמע בהיר וזמזמי - כמו כינור. הוא מכיל את כל ההרמוניות, מה שהופך אותו לעשיר ומלא. זה הסאונד האסיד הקלאסי!',
            tip: '🎻 שיניים = עשיר ואגרסיבי'
          },
          {
            title: 'גל פולס',
            content: 'גל PULSE נשמע חלול ועצי - כמו קלרינט. יש לו רק הרמוניות אי-זוגיות, מה שנותן לו אופי שונה.',
            tip: '🎺 פולס = חלול ואגרופי'
          },
          {
            title: 'נסו!',
            content: 'החליפו בין SAW ל-PULSE. הקשיבו כמה הם שונים כשמנגנים את אותן תווים!',
            tip: '👂 עצמו עיניים והקשיבו באמת'
          }
        ],
        challenge: {
          description: 'החליפו צורות גל תוך כדי ניגון',
          goal: 'שימו לב ש-SAW נשמע בהיר יותר מ-PULSE'
        }
      },
      filters: {
        title: 'פילטרים',
        description: 'עצבו את הסאונד',
        steps: [
          {
            title: 'מהו פילטר?',
            content: 'פילטר מסיר תדרים. ה-TB-303 משתמש בפילטר LOW-PASS - מעביר תדרים נמוכים וחותך גבוהים.',
            tip: '🔊 כמו לשים יד על רמקול!'
          },
          {
            title: 'כפתור ה-Cutoff',
            content: 'CUTOFF קובע איפה הפילטר חותך. נמוך = כהה, מעומעם. גבוה = בהיר, חותך. זה הכפתור הכי חשוב!',
            tip: '🎛️ Cutoff הוא החבר הכי טוב שלכם!'
          },
          {
            title: 'סחפו את הפילטר',
            content: 'סובבו לאט את CUTOFF מ-0 ל-100% תוך כדי ניגון. שומעים איך הסאונד משתנה? זה פילטרינג!',
            tip: '✨ הסחיפה הזו היא הסאונד האסידי!'
          },
          {
            title: 'הנקודה המתוקה',
            content: 'אסיד קלאסי חי בין 20-50% cutoff. נמוך מדי = בוץ. גבוה מדי = חריף. סמכו על האוזניים!',
            tip: '🎯 הוסיפו אוטומציה ל-cutoff לתנועה!'
          }
        ],
        challenge: {
          description: 'סחפו cutoff תוך כדי ניגון',
          goal: 'מצאו הגדרת cutoff שאתם אוהבים'
        }
      },
      resonance: {
        title: 'רזוננס',
        description: 'הוסיפו את הסקוולץ\'',
        steps: [
          {
            title: 'מהו רזוננס?',
            content: 'רזוננס מגביר תדרים בנקודת ה-cutoff. זה גורם לפילטר "לצלצל" - זה הסקוולץ\' האסידי המיוחד!',
            tip: '🔔 רזוננס = פידבק פילטר = סקוולץ\'!'
          },
          {
            title: 'רזוננס נמוך',
            content: 'ב-0-30%, הפילטר חלק ועדין. טוב לבאסים חמים ולידים עדינים.',
            tip: '😌 רזו נמוך = חלק ומוזיקלי'
          },
          {
            title: 'רזוננס גבוה',
            content: 'מעל 60%, דברים נהיים פרועים! הפילטר מתחיל לשיר, לצרוח ולסקוולץ\'. טריטוריה אסידית טהורה!',
            tip: '🔥 רזו גבוה = אסיד צורח!'
          },
          {
            title: 'הנקודה המתוקה',
            content: 'נסו רזוננס 50-70% עם cutoff 30-40%. שחקו עם שניהם יחד - כאן קורה הקסם!',
            tip: '✨ Cutoff + רזוננס = החתימה שלכם'
          }
        ],
        challenge: {
          description: 'רזוננס גבוה + סחיפת cutoff',
          goal: 'צרו את הסקוולץ\' הקלאסי'
        }
      },
      envelopes: {
        title: 'מעטפות',
        description: 'עצבו סאונד לאורך זמן',
        steps: [
          {
            title: 'מהי מעטפת?',
            content: 'מעטפת שולטת איך פרמטר משתנה לאורך זמן. ב-TB-303, היא יוצרת את התקיפה "וואה" האופיינית!',
            tip: '📈 מעטפות מוסיפות חיים לצלילים סטטיים'
          },
          {
            title: 'מודולציית מעטפת',
            content: 'ENV MOD שולט כמה המעטפת משפיעה על הפילטר. גבוה = סחיפה דרמטית. נמוך = תנועה עדינה.',
            tip: '💥 Env Mod גבוה = התקפות אגרופיות!'
          },
          {
            title: 'זמן דעיכה',
            content: 'DECAY שולט כמה זמן המעטפת יורדת. קצר = "בליפ" מהיר. ארוך = "וואאאה" איטי.',
            tip: '⏱️ מהיר = קצבי. איטי = זורם'
          },
          {
            title: 'הקומבו',
            content: 'הגדירו Cutoff נמוך (30%), Env Mod גבוה (60%), Decay בינוני (40%). כל תו "פותח" את הפילטר - אסיד קלאסי!',
            tip: '🎹 זה הגדיר את אסיד האוס!'
          }
        ],
        challenge: {
          description: 'Cutoff נמוך + Env mod גבוה',
          goal: 'צרו תווים אגרופיים ופרקסיביים'
        }
      },
      accents: {
        title: 'אקצנטים',
        description: 'הוסיפו דגש',
        steps: [
          {
            title: 'מהם אקצנטים?',
            content: 'אקצנטים הופכים תווים מסוימים לחזקים ובהירים יותר. הם מוסיפים דינמיקה וגרוב - גורמים לפטרנים להרגיש חיים!',
            tip: '🥁 אקצנטים יוצרים קצב!'
          },
          {
            title: 'כפתור האקצנט',
            content: 'שולט כמה יותר חזקים/בהירים התווים המודגשים. גבוה יותר = הבדל דרמטי יותר.',
            tip: '💪 אקצנטים חזקים = גרוב אגרופי!'
          },
          {
            title: 'הוספת אקצנטים',
            content: 'בעורך הצעדים, הפעילו "A" להדגשת תווים. נסו להדגיש פעימה 1 של כל תיבה, או אוף-ביטים לפאנק!',
            tip: '🎵 הדגישו כל תו 4 או 8'
          },
          {
            title: 'אקצנט + רזוננס',
            content: 'אקצנטים גם מגבירים רזוננס! אקצנט גבוה + רזוננס גבוה = פגיעות צורחות וסקוולצ\'יות. הרוטב הסודי!',
            tip: '🔥 תווים מודגשים צורחים!'
          }
        ],
        challenge: {
          description: 'הוסיפו אקצנטים בפעימות 1 ו-3',
          goal: 'הרגישו איך אקצנטים יוצרים גרוב'
        }
      },
      slides: {
        title: 'סליידים',
        description: 'מעברים חלקים',
        steps: [
          {
            title: 'מהם סליידים?',
            content: 'סליידים גורמים לגובה הצליל לגלוש בחלקות בין תווים במקום לקפוץ. כמו להחליק אצבע על גיטרה!',
            tip: '🎸 סליידים מוסיפים ביטוי'
          },
          {
            title: 'הסלייד של ה-303',
            content: 'הסלייד של ה-303 מיוחד - הוא מאריך את התו ושומר את הפילטר פתוח יותר זמן. יוצר "סליידים סקוולצ\'יים"!',
            tip: '✨ סליידים של 303 הם אגדיים!'
          },
          {
            title: 'הוספת סליידים',
            content: 'הפעילו "S" בעורך הצעדים. סליידים בין תווים רחוקים נשמעים יותר דרמטיים!',
            tip: '🎵 נסו תו נמוך → תו גבוה!'
          },
          {
            title: 'סלייד + אקצנט',
            content: 'סלייד מודגש הוא חזק! התו גולש פנימה תוך כדי צריחה. השתמשו במשורה להשפעה מקסימלית!',
            tip: '💥 סליידים מודגשים = נשק סודי!'
          }
        ],
        challenge: {
          description: 'סלייד בין תווים במרחק אוקטבה',
          goal: 'שמעו את הגלישה החלקה'
        }
      },
      modulation: {
        title: 'מודולציה',
        description: 'תנועה אוטומטית',
        steps: [
          {
            title: 'מהו LFO?',
            content: 'LFO = אוסילטור תדר נמוך. איטי מדי לשמיעה, אבל הוא מזיז פרמטרים אוטומטית - כמו רובוט שמסובב כפתורים!',
            tip: '🤖 LFOs מוסיפים חיים אוטומטית!'
          },
          {
            title: 'צורות LFO',
            content: 'SINE = גלים חלקים. TRIANGLE = יותר חד. SQUARE = קפיצות פתאומיות. RANDOM = כאוס!',
            tip: '🌊 סיין לעדין, סקוור לקצבי'
          },
          {
            title: 'מהירות ועומק',
            content: 'RATE = מהירות. DEPTH = עוצמה. התחילו איטי ועדין, אז נסו!',
            tip: '🎛️ Rate מהיר + Depth נמוך = נצנוץ'
          },
          {
            title: 'סנכרון לטמפו',
            content: 'לחצו SYNC לנעול LFO לטמפו. נסו 1/4 או 1/8 תווים לתנועה קצבית!',
            tip: '🔒 LFOs מסונכרנים נשמעים מוזיקליים!'
          }
        ],
        challenge: {
          description: 'הוסיפו LFO סיין איטי ל-cutoff',
          goal: 'שמעו את הפילטר נושם'
        }
      },
      automation: {
        title: 'אוטומציה',
        description: 'ציירו שינויים',
        steps: [
          {
            title: 'מהי אוטומציה?',
            content: 'אוטומציה מאפשרת לצייר איך פרמטר משתנה לאורך הפטרן. כמו להקליט תנועות כפתורים!',
            tip: '✏️ העוזר הרובוטי האישי שלכם!'
          },
          {
            title: 'ציור',
            content: 'עברו לתצוגת אוטומציה, בחרו פרמטר, ולחצו/גררו לצייר. הסינת\' עוקב בדיוק!',
            tip: '🎨 קווים עולים לבילדאפים!'
          },
          {
            title: 'רעיונות',
            content: 'נסו: Cutoff עולה לאורך הפטרן. או: Decay גבוה בהתחלה, קצר בסוף. היו יצירתיים!',
            tip: '💡 אוטומציה מחייה פטרנים!'
          },
          {
            title: 'שלבו הכל!',
            content: 'השתמשו באוטומציה לתנועות גדולות, LFOs לרטט עדין, וכיוונים ידניים להופעה!',
            tip: '🎭 שכבות = סאונד מקצועי!'
          }
        ],
        challenge: {
          description: 'ציירו אוטומציית cutoff עולה',
          goal: 'צפו בפילטר עוקב אחרי הציור שלכם'
        }
      }
    }
  },
  
  ru: {
    ui: {
      title: 'Академия звукового дизайна',
      subtitle: 'Изучите искусство синтеза',
      backToLessons: 'К урокам',
      previous: 'Назад',
      next: 'Далее',
      complete: 'Завершить',
      stepOf: 'Шаг {current} из {total}',
      progress: 'Прогресс',
      welcome: 'Добро пожаловать, исследователь звука!',
      welcomeMessage: 'Готовы влюбиться в синтез? Каждый урок обучает базовому концепту с практикой. Экспериментируйте с контролями во время обучения!',
      proTip: 'Совет',
      challenge: 'Задание!',
      goal: 'Цель',
      tryIt: 'Попробуйте!',
      steps: 'шагов'
    },
    lessons: {
      oscillators: {
        title: 'Осцилляторы',
        description: 'Источник всего звука',
        steps: [
          {
            title: 'Что такое осциллятор?',
            content: 'Осциллятор генерирует сырую звуковую волну. Как вибрирующая струна гитары, но электронная!',
            tip: '🎸 Настоящие инструменты вибрируют воздух. Синтезаторы - электроны!'
          },
          {
            title: 'Пилообразная волна',
            content: 'SAW звучит ярко и жужжаще - как скрипка. Содержит ВСЕ гармоники. Это классический acid звук!',
            tip: '🎻 Пила = Богатый и агрессивный'
          },
          {
            title: 'Прямоугольная волна',
            content: 'PULSE звучит глухо - как кларнет. Только нечётные гармоники, другой характер.',
            tip: '🎺 Pulse = Глухой и ударный'
          },
          {
            title: 'Попробуйте!',
            content: 'Переключайтесь между SAW и PULSE. Слышите разницу на тех же нотах?',
            tip: '👂 Закройте глаза и слушайте'
          }
        ],
        challenge: {
          description: 'Меняйте волны во время игры',
          goal: 'Заметьте, что SAW ярче чем PULSE'
        }
      },
      filters: {
        title: 'Фильтры',
        description: 'Формируйте звук',
        steps: [
          {
            title: 'Что такое фильтр?',
            content: 'Фильтр удаляет частоты. TB-303 использует LOW-PASS - пропускает низкие, режет высокие.',
            tip: '🔊 Как закрыть динамик рукой!'
          },
          {
            title: 'Регулятор Cutoff',
            content: 'CUTOFF определяет где фильтр режет. Низко = тёмно. Высоко = ярко. Главный регулятор!',
            tip: '🎛️ Cutoff - ваш лучший друг!'
          },
          {
            title: 'Sweep фильтра',
            content: 'Медленно крутите CUTOFF от 0 до 100% играя. Слышите изменения? Это фильтрация!',
            tip: '✨ Этот sweep и есть acid звук!'
          },
          {
            title: 'Золотая середина',
            content: 'Классический acid живёт между 20-50% cutoff. Ниже = муть. Выше = резкость. Доверяйте ушам!',
            tip: '🎯 Автоматизируйте cutoff для движения!'
          }
        ],
        challenge: {
          description: 'Sweep cutoff во время игры',
          goal: 'Найдите настройку которая нравится'
        }
      },
      resonance: {
        title: 'Резонанс',
        description: 'Добавьте squelch',
        steps: [
          {
            title: 'Что такое резонанс?',
            content: 'Резонанс усиливает частоты в точке cutoff. Фильтр начинает "звенеть" - это acid squelch!',
            tip: '🔔 Резонанс = Обратная связь = SQUELCH!'
          },
          {
            title: 'Низкий резонанс',
            content: 'При 0-30% фильтр плавный и мягкий. Хорошо для тёплых басов и нежных лидов.',
            tip: '😌 Низкий резо = Гладко и музыкально'
          },
          {
            title: 'Высокий резонанс',
            content: 'Выше 60% становится дико! Фильтр поёт, кричит и squelch-ит. Чистый acid!',
            tip: '🔥 Высокий резо = Кричащий Acid!'
          },
          {
            title: 'Золотая середина',
            content: 'Попробуйте резонанс 50-70% с cutoff 30-40%. Играйте с обоими - тут магия!',
            tip: '✨ Cutoff + Резонанс = Ваш звук'
          }
        ],
        challenge: {
          description: 'Высокий резонанс + sweep cutoff',
          goal: 'Создайте классический squelch'
        }
      },
      envelopes: {
        title: 'Огибающие',
        description: 'Формируйте звук во времени',
        steps: [
          {
            title: 'Что такое огибающая?',
            content: 'Огибающая контролирует как параметр меняется во времени. В TB-303 создаёт характерную "вах" атаку!',
            tip: '📈 Огибающие добавляют ЖИЗНЬ звукам'
          },
          {
            title: 'Модуляция огибающей',
            content: 'ENV MOD контролирует влияние огибающей на фильтр. Высоко = драматичный sweep. Низко = мягкое движение.',
            tip: '💥 Высокий Env Mod = Ударные атаки!'
          },
          {
            title: 'Время затухания',
            content: 'DECAY контролирует скорость спада. Короткий = быстрый "блип". Длинный = медленный "вааах".',
            tip: '⏱️ Быстро = Ритмично. Медленно = Плавно'
          },
          {
            title: 'Комбо',
            content: 'Cutoff низко (30%), Env Mod высоко (60%), Decay средне (40%). Каждая нота "открывает" фильтр!',
            tip: '🎹 Это определило acid house!'
          }
        ],
        challenge: {
          description: 'Низкий cutoff + высокий env mod',
          goal: 'Создайте ударные, перкуссионные ноты'
        }
      },
      accents: {
        title: 'Акценты',
        description: 'Добавьте выразительность',
        steps: [
          {
            title: 'Что такое акценты?',
            content: 'Акценты делают ноты ГРОМЧЕ и ЯРЧЕ. Добавляют динамику и грув - паттерны оживают!',
            tip: '🥁 Акценты создают ритм!'
          },
          {
            title: 'Регулятор акцента',
            content: 'Контролирует насколько громче/ярче акцентированные ноты. Выше = драматичнее.',
            tip: '💪 Сильные акценты = Ударный грув!'
          },
          {
            title: 'Добавление акцентов',
            content: 'В редакторе шагов включите "A". Акцентируйте 1-й бит такта или офф-биты для фанка!',
            tip: '🎵 Акцент каждой 4-й или 8-й ноты'
          },
          {
            title: 'Акцент + Резонанс',
            content: 'Акценты усиливают резонанс! Высокий акцент + резонанс = кричащие, squelch-евые удары!',
            tip: '🔥 Акцентированные ноты КРИЧАТ!'
          }
        ],
        challenge: {
          description: 'Акценты на битах 1 и 3',
          goal: 'Почувствуйте как акценты создают грув'
        }
      },
      slides: {
        title: 'Слайды',
        description: 'Плавные переходы',
        steps: [
          {
            title: 'Что такое слайды?',
            content: 'Слайды заставляют высоту плавно скользить между нотами вместо прыжков. Как палец по грифу гитары!',
            tip: '🎸 Слайды добавляют выразительность'
          },
          {
            title: 'Слайд 303',
            content: 'Слайд 303 особенный - удлиняет ноту и держит фильтр открытым дольше. Создаёт "squelchy слайды"!',
            tip: '✨ Слайды 303 легендарны!'
          },
          {
            title: 'Добавление слайдов',
            content: 'Включите "S" в редакторе шагов. Слайды между далёкими нотами звучат драматичнее!',
            tip: '🎵 Попробуйте низко → высоко!'
          },
          {
            title: 'Слайд + Акцент',
            content: 'Акцентированный слайд мощный! Нота въезжает с криком. Используйте редко для максимального эффекта!',
            tip: '💥 Акцентированные слайды = Секретное оружие!'
          }
        ],
        challenge: {
          description: 'Слайд между нотами на октаву',
          goal: 'Услышьте плавное скольжение'
        }
      },
      modulation: {
        title: 'Модуляция',
        description: 'Автоматическое движение',
        steps: [
          {
            title: 'Что такое LFO?',
            content: 'LFO = Низкочастотный осциллятор. Слишком медленный для слуха, но двигает параметры автоматически!',
            tip: '🤖 LFO добавляют жизнь автоматически!'
          },
          {
            title: 'Формы LFO',
            content: 'SINE = плавные волны. TRIANGLE = острее. SQUARE = резкие скачки. RANDOM = хаос!',
            tip: '🌊 Sine для мягкого, Square для ритма'
          },
          {
            title: 'Скорость и глубина',
            content: 'RATE = скорость. DEPTH = интенсивность. Начните медленно и мягко, потом экспериментируйте!',
            tip: '🎛️ Быстрый rate + низкий depth = Мерцание'
          },
          {
            title: 'Синхронизация с темпом',
            content: 'Нажмите SYNC чтобы привязать LFO к темпу. Попробуйте 1/4 или 1/8 для ритмичного движения!',
            tip: '🔒 Синхронизированные LFO звучат музыкально!'
          }
        ],
        challenge: {
          description: 'Медленный sine LFO на cutoff',
          goal: 'Услышьте как фильтр "дышит"'
        }
      },
      automation: {
        title: 'Автоматизация',
        description: 'Рисуйте изменения',
        steps: [
          {
            title: 'Что такое автоматизация?',
            content: 'Автоматизация позволяет РИСОВАТЬ как параметр меняется в паттерне. Как запись движений ручек!',
            tip: '✏️ Ваш личный робот-помощник!'
          },
          {
            title: 'Рисование',
            content: 'Переключитесь в вид автоматизации, выберите параметр, кликайте/тяните для рисования. Синтезатор следует идеально!',
            tip: '🎨 Восходящие линии для нарастаний!'
          },
          {
            title: 'Идеи',
            content: 'Попробуйте: Растущий cutoff по паттерну. Или: Высокий decay в начале, короткий в конце. Творите!',
            tip: '💡 Автоматизация оживляет паттерны!'
          },
          {
            title: 'Комбинируйте всё!',
            content: 'Автоматизация для больших движений, LFO для лёгкой вибрации, ручная настройка для выступления!',
            tip: '🎭 Слои = Профессиональный звук!'
          }
        ],
        challenge: {
          description: 'Нарисуйте растущую автоматизацию cutoff',
          goal: 'Смотрите как фильтр следует за рисунком'
        }
      }
    }
  },
  
  ar: {
    ui: {
      title: 'أكاديمية تصميم الصوت',
      subtitle: 'تعلم فن التوليف',
      backToLessons: 'العودة للدروس',
      previous: 'السابق',
      next: 'التالي',
      complete: 'إكمال',
      stepOf: 'الخطوة {current} من {total}',
      progress: 'التقدم',
      welcome: 'مرحباً، مستكشف الصوت!',
      welcomeMessage: 'مستعد للوقوع في حب التوليف؟ كل درس يعلم مفهوماً أساسياً مع تمارين عملية. جرب أدوات التحكم أثناء التعلم!',
      proTip: 'نصيحة احترافية',
      challenge: 'تحدي!',
      goal: 'الهدف',
      tryIt: 'جربه الآن!',
      steps: 'خطوات'
    },
    lessons: {
      oscillators: {
        title: 'المذبذبات',
        description: 'مصدر كل الصوت',
        steps: [
          {
            title: 'ما هو المذبذب؟',
            content: 'المذبذب يولد موجة الصوت الخام. فكر فيه مثل وتر جيتار يهتز - لكن إلكتروني!',
            tip: '🎸 الآلات الحقيقية تهز الهواء. السينثات تهز الإلكترونات!'
          },
          {
            title: 'موجة المنشار',
            content: 'موجة SAW تبدو مشرقة وطنانة - مثل الكمان. تحتوي على كل التوافقيات، مما يجعلها غنية وممتلئة. هذا هو صوت الأسيد الكلاسيكي!',
            tip: '🎻 المنشار = غني وعدواني'
          },
          {
            title: 'موجة النبضة',
            content: 'موجة PULSE تبدو مجوفة وخشبية - مثل الكلارينيت. لديها فقط التوافقيات الفردية، مما يعطيها طابعاً مختلفاً.',
            tip: '🎺 النبضة = مجوفة وقوية'
          },
          {
            title: 'جربها!',
            content: 'بدّل بين SAW و PULSE. استمع كيف يختلف صوتهما عند عزف نفس النوتات!',
            tip: '👂 أغمض عينيك واستمع حقاً'
          }
        ],
        challenge: {
          description: 'بدّل أشكال الموجة أثناء العزف',
          goal: 'لاحظ كيف SAW أكثر سطوعاً من PULSE'
        }
      },
      filters: {
        title: 'الفلاتر',
        description: 'شكّل صوتك',
        steps: [
          {
            title: 'ما هو الفلتر؟',
            content: 'الفلتر يزيل الترددات. TB-303 يستخدم فلتر LOW-PASS - يمرر الترددات المنخفضة ويقطع العالية.',
            tip: '🔊 مثل وضع يدك على مكبر الصوت!'
          },
          {
            title: 'مقبض القطع',
            content: 'CUTOFF يتحكم أين يقطع الفلتر. منخفض = داكن، مكتوم. عالي = ساطع، حاد. هذا أهم مقبض!',
            tip: '🎛️ Cutoff هو صديقك الأفضل!'
          },
          {
            title: 'مسح الفلتر',
            content: 'أدر CUTOFF ببطء من 0 إلى 100% أثناء العزف. تسمع كيف يتغير الصوت؟ هذا هو الفلترة!',
            tip: '✨ هذا المسح هو صوت الأسيد!'
          },
          {
            title: 'النقطة المثالية',
            content: 'الأسيد الكلاسيكي يعيش بين 20-50% cutoff. منخفض جداً = طين. عالي جداً = حاد. ثق بأذنيك!',
            tip: '🎯 أضف أتمتة للـ cutoff للحركة!'
          }
        ],
        challenge: {
          description: 'امسح cutoff أثناء العزف',
          goal: 'اعثر على إعداد cutoff تحبه'
        }
      },
      resonance: {
        title: 'الرنين',
        description: 'أضف السكويلش',
        steps: [
          {
            title: 'ما هو الرنين؟',
            content: 'الرنين يعزز الترددات عند نقطة القطع. يجعل الفلتر "يرن" - هذا هو سكويلش الأسيد المميز!',
            tip: '🔔 الرنين = تغذية راجعة = سكويلش!'
          },
          {
            title: 'رنين منخفض',
            content: 'عند 0-30%، الفلتر ناعم ولطيف. جيد للباسات الدافئة والليدات اللطيفة.',
            tip: '😌 رنين منخفض = ناعم وموسيقي'
          },
          {
            title: 'رنين عالي',
            content: 'فوق 60%، الأمور تصبح جامحة! الفلتر يبدأ بالغناء، الصراخ، والسكويلش. منطقة أسيد صافية!',
            tip: '🔥 رنين عالي = أسيد صارخ!'
          },
          {
            title: 'النقطة المثالية',
            content: 'جرب رنين 50-70% مع cutoff 30-40%. العب بكليهما معاً - هنا يحدث السحر!',
            tip: '✨ Cutoff + رنين = توقيعك الخاص'
          }
        ],
        challenge: {
          description: 'رنين عالي + مسح cutoff',
          goal: 'اصنع ذلك السكويلش الكلاسيكي'
        }
      },
      envelopes: {
        title: 'الأغلفة',
        description: 'شكّل الصوت عبر الزمن',
        steps: [
          {
            title: 'ما هو الغلاف؟',
            content: 'الغلاف يتحكم كيف يتغير البارامتر عبر الزمن. في TB-303، يخلق هجوم "واه" المميز!',
            tip: '📈 الأغلفة تضيف حياة للأصوات الثابتة'
          },
          {
            title: 'تعديل الغلاف',
            content: 'ENV MOD يتحكم كم يؤثر الغلاف على الفلتر. عالي = مسح درامي. منخفض = حركة لطيفة.',
            tip: '💥 Env Mod عالي = هجمات قوية!'
          },
          {
            title: 'وقت الانحلال',
            content: 'DECAY يتحكم كم يستغرق الغلاف للسقوط. قصير = "بليب" سريع. طويل = "واااه" بطيء.',
            tip: '⏱️ سريع = إيقاعي. بطيء = انسيابي'
          },
          {
            title: 'التركيبة',
            content: 'اضبط Cutoff منخفض (30%)، Env Mod عالي (60%)، Decay متوسط (40%). كل نوتة "تفتح" الفلتر - أسيد كلاسيكي!',
            tip: '🎹 هذا عرّف أسيد هاوس!'
          }
        ],
        challenge: {
          description: 'Cutoff منخفض + Env mod عالي',
          goal: 'اصنع نوتات قوية وإيقاعية'
        }
      },
      accents: {
        title: 'التشديدات',
        description: 'أضف التأكيد',
        steps: [
          {
            title: 'ما هي التشديدات؟',
            content: 'التشديدات تجعل بعض النوتات أعلى وأسطع. تضيف ديناميكية وغروف - تجعل الأنماط تشعر بالحياة!',
            tip: '🥁 التشديدات تخلق الإيقاع!'
          },
          {
            title: 'مقبض التشديد',
            content: 'يتحكم كم أعلى/أسطع النوتات المشددة. أعلى = فرق أكثر دراماتيكية.',
            tip: '💪 تشديدات قوية = غروف قوي!'
          },
          {
            title: 'إضافة التشديدات',
            content: 'في محرر الخطوات، فعّل "A" للتشديد. جرب تشديد النبضة 1 من كل تقسيمة، أو الأوف بيتس للفانك!',
            tip: '🎵 شدد كل نوتة 4 أو 8'
          },
          {
            title: 'تشديد + رنين',
            content: 'التشديدات أيضاً تعزز الرنين! تشديد عالي + رنين عالي = ضربات صارخة وسكويلشية. الصلصة السرية!',
            tip: '🔥 النوتات المشددة تصرخ!'
          }
        ],
        challenge: {
          description: 'أضف تشديدات على النبضات 1 و 3',
          goal: 'اشعر كيف التشديدات تخلق غروف'
        }
      },
      slides: {
        title: 'الانزلاقات',
        description: 'انتقالات ناعمة',
        steps: [
          {
            title: 'ما هي الانزلاقات؟',
            content: 'الانزلاقات تجعل النغمة تنزلق بسلاسة بين النوتات بدلاً من القفز. مثل تحريك إصبعك على الجيتار!',
            tip: '🎸 الانزلاقات تضيف تعبيراً'
          },
          {
            title: 'انزلاق الـ 303',
            content: 'انزلاق الـ 303 مميز - يمدد النوتة ويبقي الفلتر مفتوحاً أطول. يخلق "انزلاقات سكويلشية"!',
            tip: '✨ انزلاقات 303 أسطورية!'
          },
          {
            title: 'إضافة الانزلاقات',
            content: 'فعّل "S" في محرر الخطوات. الانزلاقات بين النوتات البعيدة تبدو أكثر دراماتيكية!',
            tip: '🎵 جرب نوتة منخفضة → نوتة عالية!'
          },
          {
            title: 'انزلاق + تشديد',
            content: 'الانزلاق المشدد قوي! النوتة تنزلق وهي تصرخ. استخدم بحذر للتأثير الأقصى!',
            tip: '💥 الانزلاقات المشددة = سلاح سري!'
          }
        ],
        challenge: {
          description: 'انزلاق بين نوتات على بعد أوكتاف',
          goal: 'اسمع الانزلاق الناعم'
        }
      },
      modulation: {
        title: 'التعديل',
        description: 'حركة تلقائية',
        steps: [
          {
            title: 'ما هو LFO؟',
            content: 'LFO = مذبذب منخفض التردد. بطيء جداً للسمع، لكنه يحرك البارامترات تلقائياً - مثل روبوت يدير المقابض!',
            tip: '🤖 LFOs تضيف حياة تلقائياً!'
          },
          {
            title: 'أشكال LFO',
            content: 'SINE = موجات ناعمة. TRIANGLE = أكثر حدة. SQUARE = قفزات مفاجئة. RANDOM = فوضى!',
            tip: '🌊 Sine للناعم، Square للإيقاعي'
          },
          {
            title: 'السرعة والعمق',
            content: 'RATE = السرعة. DEPTH = الشدة. ابدأ بطيئاً وناعماً، ثم جرب!',
            tip: '🎛️ Rate سريع + Depth منخفض = وميض'
          },
          {
            title: 'المزامنة مع الإيقاع',
            content: 'انقر SYNC لقفل LFO بالإيقاع. جرب 1/4 أو 1/8 نوتات لحركة إيقاعية!',
            tip: '🔒 LFOs المتزامنة تبدو موسيقية!'
          }
        ],
        challenge: {
          description: 'أضف LFO sine بطيء للـ cutoff',
          goal: 'اسمع الفلتر "يتنفس"'
        }
      },
      automation: {
        title: 'الأتمتة',
        description: 'ارسم التغييرات',
        steps: [
          {
            title: 'ما هي الأتمتة؟',
            content: 'الأتمتة تتيح لك رسم كيف يتغير البارامتر خلال النمط. مثل تسجيل حركات المقابض!',
            tip: '✏️ مساعدك الروبوتي الشخصي!'
          },
          {
            title: 'الرسم',
            content: 'انتقل لعرض الأتمتة، اختر بارامتر، وانقر/اسحب للرسم. السينث يتبع بدقة!',
            tip: '🎨 خطوط صاعدة للبناء!'
          },
          {
            title: 'أفكار',
            content: 'جرب: Cutoff صاعد خلال النمط. أو: Decay عالي في البداية، قصير في النهاية. كن مبدعاً!',
            tip: '💡 الأتمتة تحيي الأنماط!'
          },
          {
            title: 'اجمع الكل!',
            content: 'استخدم الأتمتة للحركات الكبيرة، LFOs للاهتزاز اللطيف، والتعديلات اليدوية للأداء!',
            tip: '🎭 الطبقات = صوت احترافي!'
          }
        ],
        challenge: {
          description: 'ارسم أتمتة cutoff صاعدة',
          goal: 'شاهد الفلتر يتبع رسمك'
        }
      }
    }
  },
  
  es: {
    ui: {
      title: 'Academia de Diseño de Sonido',
      subtitle: 'Aprende el arte de la síntesis',
      backToLessons: 'Volver a lecciones',
      previous: 'Anterior',
      next: 'Siguiente',
      complete: 'Completar',
      stepOf: 'Paso {current} de {total}',
      progress: 'Progreso',
      welcome: '¡Bienvenido, explorador del sonido!',
      welcomeMessage: '¿Listo para enamorarte de la síntesis? Cada lección enseña un concepto fundamental con ejercicios prácticos. ¡Experimenta con los controles mientras aprendes!',
      proTip: 'Consejo Pro',
      challenge: '¡Desafío!',
      goal: 'Objetivo',
      tryIt: '¡Pruébalo ahora!',
      steps: 'pasos'
    },
    lessons: {
      oscillators: {
        title: 'Osciladores',
        description: 'La fuente de todo sonido',
        steps: [
          {
            title: '¿Qué es un oscilador?',
            content: 'Un oscilador genera la onda de sonido cruda. ¡Piensa en él como una cuerda de guitarra vibrando, pero electrónica!',
            tip: '🎸 Los instrumentos reales vibran aire. ¡Los sintetizadores vibran electrones!'
          },
          {
            title: 'Onda Sierra',
            content: 'La onda SAW suena brillante y zumbante - como un violín. Contiene TODOS los armónicos, haciéndola rica y llena. ¡Este es el sonido acid clásico!',
            tip: '🎻 Sierra = Rico y Agresivo'
          },
          {
            title: 'Onda Pulso',
            content: 'La onda PULSE suena hueca y amaderada - como un clarinete. Solo tiene armónicos IMPARES, dándole un carácter diferente.',
            tip: '🎺 Pulso = Hueco y Punchy'
          },
          {
            title: '¡Pruébalo!',
            content: 'Alterna entre SAW y PULSE. ¡Escucha cómo suenan diferente tocando las mismas notas!',
            tip: '👂 Cierra los ojos y ESCUCHA de verdad'
          }
        ],
        challenge: {
          description: 'Cambia formas de onda mientras tocas',
          goal: 'Nota cómo SAW suena más brillante que PULSE'
        }
      },
      filters: {
        title: 'Filtros',
        description: 'Esculpe tu sonido',
        steps: [
          {
            title: '¿Qué es un filtro?',
            content: 'Un filtro elimina frecuencias. El TB-303 usa un filtro LOW-PASS - deja pasar frecuencias bajas mientras corta las altas.',
            tip: '🔊 ¡Como poner tu mano sobre un altavoz!'
          },
          {
            title: 'El knob Cutoff',
            content: 'CUTOFF controla DÓNDE corta el filtro. Bajo = oscuro, amortiguado. Alto = brillante, cortante. ¡Este es el knob más importante!',
            tip: '🎛️ ¡Cutoff es tu mejor amigo!'
          },
          {
            title: 'Barrer el filtro',
            content: 'Gira lentamente CUTOFF del 0 al 100% mientras tocas. ¿Escuchas cómo cambia el sonido? ¡Eso es filtrado!',
            tip: '✨ ¡Este barrido ES el sonido acid!'
          },
          {
            title: 'El punto dulce',
            content: 'El acid clásico vive entre 20-50% de cutoff. Muy bajo = barro. Muy alto = áspero. ¡Confía en tus oídos!',
            tip: '🎯 ¡Automatiza cutoff para movimiento!'
          }
        ],
        challenge: {
          description: 'Barre cutoff mientras tocas',
          goal: 'Encuentra un ajuste de cutoff que te guste'
        }
      },
      resonance: {
        title: 'Resonancia',
        description: 'Añade el squelch',
        steps: [
          {
            title: '¿Qué es la resonancia?',
            content: 'La resonancia AMPLIFICA las frecuencias en el punto de cutoff. Hace que el filtro "resuene" - ¡ese es el squelch acid característico!',
            tip: '🔔 ¡Resonancia = Retroalimentación del filtro = SQUELCH!'
          },
          {
            title: 'Resonancia baja',
            content: 'Al 0-30%, el filtro es suave y sutil. Bueno para bajos cálidos y leads suaves.',
            tip: '😌 Reso bajo = Suave y Musical'
          },
          {
            title: 'Resonancia alta',
            content: '¡Por encima del 60%, las cosas se vuelven LOCAS! El filtro empieza a cantar, gritar y squelchear. ¡Territorio acid puro!',
            tip: '🔥 ¡Reso alto = Acid Gritando!'
          },
          {
            title: 'El punto dulce',
            content: 'Prueba resonancia 50-70% con cutoff 30-40%. Juega con ambos juntos - ¡aquí ocurre la magia!',
            tip: '✨ Cutoff + Resonancia = Tu firma'
          }
        ],
        challenge: {
          description: 'Resonancia alta + barre cutoff',
          goal: 'Crea ese squelch clásico'
        }
      },
      envelopes: {
        title: 'Envolventes',
        description: 'Da forma al sonido en el tiempo',
        steps: [
          {
            title: '¿Qué es una envolvente?',
            content: 'Una envolvente controla cómo cambia un parámetro en el tiempo. ¡En el TB-303, crea ese distintivo ataque "wah"!',
            tip: '📈 Las envolventes añaden VIDA a los sonidos estáticos'
          },
          {
            title: 'Modulación de envolvente',
            content: 'ENV MOD controla cuánto afecta la envolvente al filtro. Alto = barrido dramático. Bajo = movimiento sutil.',
            tip: '💥 ¡Env Mod alto = Ataques punchy!'
          },
          {
            title: 'Tiempo de decaimiento',
            content: 'DECAY controla cuánto tarda la envolvente en caer. Corto = "blip" rápido. Largo = "waaah" lento.',
            tip: '⏱️ Rápido = Rítmico. Lento = Fluido'
          },
          {
            title: 'El combo',
            content: 'Ajusta Cutoff bajo (30%), Env Mod alto (60%), Decay medio (40%). ¡Cada nota "abre" el filtro - acid clásico!',
            tip: '🎹 ¡Esto definió el acid house!'
          }
        ],
        challenge: {
          description: 'Cutoff bajo + Env mod alto',
          goal: 'Crea notas punchy y percusivas'
        }
      },
      accents: {
        title: 'Acentos',
        description: 'Añade énfasis',
        steps: [
          {
            title: '¿Qué son los acentos?',
            content: 'Los acentos hacen ciertas notas MÁS FUERTES y BRILLANTES. Añaden dinámica y groove - ¡hacen que los patrones se sientan vivos!',
            tip: '🥁 ¡Los acentos crean ritmo!'
          },
          {
            title: 'El knob de acento',
            content: 'Controla cuánto más fuerte/brillante son las notas acentuadas. Más alto = diferencia más dramática.',
            tip: '💪 ¡Acentos fuertes = Groove punchy!'
          },
          {
            title: 'Añadiendo acentos',
            content: 'En el editor de pasos, activa "A" para acentuar. ¡Prueba acentuar el beat 1 de cada compás, o los off-beats para funk!',
            tip: '🎵 Acentúa cada 4ª u 8ª nota'
          },
          {
            title: 'Acento + Resonancia',
            content: '¡Los acentos también aumentan la resonancia! Acento alto + resonancia alta = golpes gritones y squelchy. ¡La salsa secreta!',
            tip: '🔥 ¡Las notas acentuadas GRITAN!'
          }
        ],
        challenge: {
          description: 'Añade acentos en los beats 1 y 3',
          goal: 'Siente cómo los acentos crean groove'
        }
      },
      slides: {
        title: 'Slides',
        description: 'Deslizamientos suaves',
        steps: [
          {
            title: '¿Qué son los slides?',
            content: 'Los slides hacen que el tono se deslice suavemente entre notas en lugar de saltar. ¡Como deslizar tu dedo en una guitarra!',
            tip: '🎸 Los slides añaden expresión'
          },
          {
            title: 'El slide del 303',
            content: 'El slide del 303 es especial - extiende la nota y mantiene el filtro abierto más tiempo. ¡Crea "slides squelchy"!',
            tip: '✨ ¡Los slides del 303 son legendarios!'
          },
          {
            title: 'Añadiendo slides',
            content: 'Activa "S" en el editor de pasos. ¡Los slides entre notas lejanas suenan más dramáticos!',
            tip: '🎵 ¡Prueba nota baja → nota alta!'
          },
          {
            title: 'Slide + Acento',
            content: '¡Un slide acentuado es PODEROSO! La nota se desliza mientras grita. ¡Usa con moderación para máximo impacto!',
            tip: '💥 ¡Slides acentuados = Arma secreta!'
          }
        ],
        challenge: {
          description: 'Slide entre notas a una octava de distancia',
          goal: 'Escucha el deslizamiento suave'
        }
      },
      modulation: {
        title: 'Modulación',
        description: 'Movimiento automático',
        steps: [
          {
            title: '¿Qué es un LFO?',
            content: 'LFO = Oscilador de Baja Frecuencia. Demasiado lento para escuchar, pero mueve parámetros automáticamente - ¡como un robot girando knobs!',
            tip: '🤖 ¡Los LFOs añaden vida automáticamente!'
          },
          {
            title: 'Formas de LFO',
            content: 'SINE = ondas suaves. TRIANGLE = más puntiagudo. SQUARE = saltos repentinos. RANDOM = ¡caos!',
            tip: '🌊 Sine para sutil, Square para rítmico'
          },
          {
            title: 'Rate y Depth',
            content: 'RATE = velocidad. DEPTH = intensidad. ¡Empieza lento y sutil, luego experimenta!',
            tip: '🎛️ Rate rápido + Depth bajo = Brillo'
          },
          {
            title: 'Sincronizar al tempo',
            content: '¡Haz clic en SYNC para bloquear el LFO al tempo. Prueba 1/4 o 1/8 notas para movimiento rítmico!',
            tip: '🔒 ¡Los LFOs sincronizados suenan musicales!'
          }
        ],
        challenge: {
          description: 'Añade un LFO sine lento al cutoff',
          goal: 'Escucha el filtro "respirar"'
        }
      },
      automation: {
        title: 'Automatización',
        description: 'Dibuja cambios',
        steps: [
          {
            title: '¿Qué es la automatización?',
            content: 'La automatización te permite DIBUJAR cómo cambia un parámetro a lo largo del patrón. ¡Como grabar movimientos de knobs!',
            tip: '✏️ ¡Tu asistente robot personal!'
          },
          {
            title: 'Dibujando',
            content: 'Cambia a vista de automatización, selecciona un parámetro, y haz clic/arrastra para dibujar. ¡El sintetizador sigue perfectamente!',
            tip: '🎨 ¡Líneas ascendentes para builds!'
          },
          {
            title: 'Ideas',
            content: 'Prueba: Cutoff ascendente a lo largo del patrón. O: Decay alto al inicio, corto al final. ¡Sé creativo!',
            tip: '💡 ¡La automatización da VIDA a los patrones!'
          },
          {
            title: '¡Combina todo!',
            content: '¡Usa automatización para movimientos grandes, LFOs para wobble sutil, y ajustes manuales para performance!',
            tip: '🎭 ¡Capas = Sonido profesional!'
          }
        ],
        challenge: {
          description: 'Dibuja automatización de cutoff ascendente',
          goal: 'Mira el filtro seguir tu dibujo'
        }
      }
    }
  }
};

export function getTranslation(lang: Language): Translations {
  return translations[lang] || translations.en;
}
