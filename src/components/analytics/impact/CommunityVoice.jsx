import React, { useMemo } from 'react';

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','was','were',
  'are','be','been','being','have','has','had','do','does','did','will','would','could','should','may',
  'might','shall','can','need','must','i','me','my','we','our','you','your','he','him','his','she','her',
  'it','its','they','them','their','this','that','these','those','not','no','so','if','then','than',
  'also','very','just','about','up','out','into','over','after','before','between','through','during',
  'above','below','each','every','all','both','few','more','most','other','some','such','only','own',
  'same','there','when','where','which','while','who','whom','what','why','how','because','as','until',
  'said','like','get','got','went','go','going','going','make','made','back','way','one','two','three',
  'able','told','asked','see','came','come','take','took','know','knew','think','thought','tell','say',
  'even','still','new','want','wanted','first','time','day','look','looked','use','used','many','much',
  'well','good','right','left','big','little','long','old','great','small','high','next','last','far',
  'own','any','never','always','often','really','too','here','again','already','another','away','enough',
  'yet','around','however','am','been','had','has','having','being','doing','did','does','done','than',
  'that','which','where','who','whom','what','when','how','why','were','was','are','is','be',
]);

function extractPhrases(text) {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Bigrams
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      phrases.push(words[i] + ' ' + words[i + 1]);
    }
  }
  // Single meaningful words
  words.forEach(w => phrases.push(w));
  return phrases;
}

export default function CommunityVoice({ cases }) {
  const phraseList = useMemo(() => {
    const freqMap = {};
    cases.forEach(c => {
      const phrases = extractPhrases(c.narrative);
      const seen = new Set();
      phrases.forEach(p => {
        if (!seen.has(p)) {
          freqMap[p] = (freqMap[p] || 0) + 1;
          seen.add(p);
        }
      });
    });

    return Object.entries(freqMap)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [cases]);

  const maxCount = phraseList.length > 0 ? phraseList[0][1] : 1;

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 4px' }}>
        What are people saying?
      </h3>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '0 0 16px' }}>Community Voice — Most mentioned barriers</p>

      {phraseList.length === 0 ? (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-400)' }}>Not enough narrative data to analyze</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {phraseList.map(([phrase, count]) => {
            const ratio = count / maxCount;
            const fontSize = 0.75 + ratio * 1.0;
            const opacity = 0.5 + ratio * 0.5;
            return (
              <span
                key={phrase}
                title={`${phrase}: ${count} mentions`}
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: `${fontSize}rem`,
                  fontWeight: ratio > 0.5 ? 700 : 500,
                  color: `rgba(30, 41, 59, ${opacity})`,
                  padding: '4px 10px',
                  backgroundColor: ratio > 0.6 ? '#FEF1EC' : ratio > 0.3 ? '#F1F5F9' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                {phrase} <sup style={{ fontSize: '0.6em', color: 'var(--slate-400)' }}>{count}</sup>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}