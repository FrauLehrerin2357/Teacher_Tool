export type AccidentalMode = 'none' | 'single' | 'key'

export type GeneratedNote = {
  letter: string
  octave: number
  accidental: '#' | 'b' | 'n' | null
}

export type GeneratedWorksheet = {
  notes: GeneratedNote[]
  beatsPerMeasure: number
  measuresPerRow: number
  accidentalMode: AccidentalMode
  keySignature: string
  lowestPitch: string
  highestPitch: string
}

const naturalPitches = Array.from({ length: 5 }, (_, octaveIndex) => {
  const octave = octaveIndex + 3
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => `${letter}${octave}`)
}).flat()

const naturalSemitones: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const chromaticSpellings: { letter: string; accidental: GeneratedNote['accidental'] }[] = [
  { letter: 'C', accidental: null },
  { letter: 'C', accidental: '#' },
  { letter: 'D', accidental: null },
  { letter: 'E', accidental: 'b' },
  { letter: 'E', accidental: null },
  { letter: 'F', accidental: null },
  { letter: 'F', accidental: '#' },
  { letter: 'G', accidental: null },
  { letter: 'A', accidental: 'b' },
  { letter: 'A', accidental: null },
  { letter: 'B', accidental: 'b' },
  { letter: 'B', accidental: null },
]

const keySignatureAlteredLetters: Record<string, string[]> = {
  C: [],
  G: ['F'],
  D: ['F', 'C'],
  A: ['F', 'C', 'G'],
  E: ['F', 'C', 'G', 'D'],
  B: ['F', 'C', 'G', 'D', 'A'],
  'F#': ['F', 'C', 'G', 'D', 'A', 'E'],
  F: ['B'],
  Bb: ['B', 'E'],
  Eb: ['B', 'E', 'A'],
  Ab: ['B', 'E', 'A', 'D'],
  Db: ['B', 'E', 'A', 'D', 'G'],
  Gb: ['B', 'E', 'A', 'D', 'G', 'C'],
}

function pitchToMidi(pitch: string) {
  const match = /^([A-G])(\d+)$/.exec(pitch)
  if (!match) return -1
  return (Number(match[2]) + 1) * 12 + naturalSemitones[match[1]]
}

function midiToNote(midi: number): GeneratedNote {
  const pitchClass = ((midi % 12) + 12) % 12
  const spelling = chromaticSpellings[pitchClass]
  return {
    letter: spelling.letter,
    octave: Math.floor(midi / 12) - 1,
    accidental: spelling.accidental,
  }
}

export function createRandomWorksheet(
  noteCount: number,
  beatsPerMeasure: number,
  accidentalMode: AccidentalMode,
  keySignature: string,
  lowestPitch: string,
  highestPitch: string,
  measuresPerRow: number,
): GeneratedWorksheet {
  const lowestMidi = pitchToMidi(lowestPitch)
  const highestMidi = pitchToMidi(highestPitch)
  const candidates: GeneratedNote[] = accidentalMode === 'single'
    ? Array.from({ length: highestMidi - lowestMidi + 1 }, (_, index) => midiToNote(lowestMidi + index))
    : naturalPitches
      .filter((pitch) => {
        const midi = pitchToMidi(pitch)
        return midi >= lowestMidi && midi <= highestMidi
      })
      .map((pitch) => ({
        letter: pitch[0],
        octave: Number(pitch.slice(1)),
        accidental: null,
      }))

  if (candidates.length === 0) throw new Error('Der gewählte Tonumfang enthält keine verfügbaren Noten.')

  const notes = Array.from({ length: noteCount }, () => candidates[Math.floor(Math.random() * candidates.length)])
  const alteredCandidates = candidates.filter((note) => note.accidental !== null)
  if (accidentalMode === 'single' && alteredCandidates.length > 0 && !notes.some((note) => note.accidental !== null)) {
    notes[Math.floor(Math.random() * notes.length)] = alteredCandidates[Math.floor(Math.random() * alteredCandidates.length)]
  }

  const naturalCandidates = accidentalMode === 'single'
    ? candidates.filter((note) => note.accidental === null)
    : candidates.filter((note) => keySignatureAlteredLetters[keySignature]?.includes(note.letter))
  if ((accidentalMode === 'single' || accidentalMode === 'key') && naturalCandidates.length > 0) {
    const noteIndex = accidentalMode === 'single'
      ? notes.findIndex((note) => note.accidental === null)
      : Math.floor(Math.random() * notes.length)
    const targetIndex = noteIndex >= 0 ? noteIndex : Math.floor(Math.random() * notes.length)
    const sourceNote = accidentalMode === 'single' && notes[targetIndex].accidental === null
      ? notes[targetIndex]
      : naturalCandidates[Math.floor(Math.random() * naturalCandidates.length)]
    notes[targetIndex] = { ...sourceNote, accidental: 'n' }
  }

  return {
    notes,
    beatsPerMeasure,
    measuresPerRow,
    accidentalMode,
    keySignature,
    lowestPitch,
    highestPitch,
  }
}