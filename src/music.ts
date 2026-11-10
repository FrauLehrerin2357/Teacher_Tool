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

export type IntervalClef = 'treble' | 'bass'

export type GeneratedInterval = {
  size: number
  lower: GeneratedNote
  upper: GeneratedNote
}

export const intervalNames = [
  'Prime',
  'Sekunde',
  'Terz',
  'Quarte',
  'Quinte',
  'Sexte',
  'Septime',
  'Oktave',
  'None',
  'Dezime',
  'Undezime',
  'Duodezime',
]

const naturalPitches = Array.from({ length: 5 }, (_, octaveIndex) => {
  const octave = octaveIndex + 3
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => `${letter}${octave}`)
}).flat()
const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

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

function diatonicIndex(note: GeneratedNote) {
  return note.octave * 7 + noteLetters.indexOf(note.letter)
}

function diatonicNote(index: number): GeneratedNote {
  const letterIndex = ((index % 7) + 7) % 7
  return {
    letter: noteLetters[letterIndex],
    octave: Math.floor(index / 7),
    accidental: null,
  }
}

export function createRandomIntervals(
  count: number,
  selectedSizes: number[],
  clef: IntervalClef,
): GeneratedInterval[] {
  if (!Number.isInteger(count) || count < 1 || count > 64) {
    throw new Error('Die Anzahl der Intervalle muss zwischen 1 und 64 liegen.')
  }
  const sizes = [...new Set(selectedSizes)].filter((size) => Number.isInteger(size) && size >= 1 && size <= 12)
  if (sizes.length === 0) throw new Error('Wähle mindestens ein Intervall aus.')

  const lowestNote = clef === 'treble'
    ? { letter: 'C', octave: 4, accidental: null }
    : { letter: 'G', octave: 2, accidental: null }
  const lowestIndex = diatonicIndex(lowestNote)
  const highestNote = clef === 'treble'
    ? { letter: 'C', octave: 6, accidental: null }
    : { letter: 'D', octave: 4, accidental: null }
  const highestIndex = diatonicIndex(highestNote)
  const shuffledSizes = [...sizes]
  for (let index = shuffledSizes.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentSize = shuffledSizes[index]
    shuffledSizes[index] = shuffledSizes[swapIndex]
    shuffledSizes[swapIndex] = currentSize
  }
  const intervalSizes = Array.from({ length: count }, (_, index) => shuffledSizes[index % shuffledSizes.length])
  for (let index = intervalSizes.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentSize = intervalSizes[index]
    intervalSizes[index] = intervalSizes[swapIndex]
    intervalSizes[swapIndex] = currentSize
  }

  const intervals = intervalSizes.map((size) => {
    const candidates = Array.from({ length: highestIndex - lowestIndex + 1 }, (_, index) => lowestIndex + index)
      .filter((index) => index + size - 1 <= highestIndex)
    const lowerIndex = candidates[Math.floor(Math.random() * candidates.length)]
    return {
      size,
      lower: diatonicNote(lowerIndex),
      upper: diatonicNote(lowerIndex + size - 1),
    }
  })

  const noteSlots = intervals.flatMap((interval) => (
    interval.size === 1 ? [interval.lower] : [interval.lower, interval.upper]
  ))
  const sharpEligible = noteSlots.filter((note) => !(clef === 'treble' && note.letter === 'C' && note.octave === 6))
  const availableSlots = [...sharpEligible]

  if (availableSlots.length >= 2) {
    const sharpNote = availableSlots.splice(Math.floor(Math.random() * availableSlots.length), 1)[0]
    const flatNote = availableSlots.splice(Math.floor(Math.random() * availableSlots.length), 1)[0]
    sharpNote.accidental = '#'
    flatNote.accidental = 'b'
  } else if (availableSlots.length === 1) {
    availableSlots[0].accidental = Math.random() < 0.5 ? '#' : 'b'
  }

  for (const note of noteSlots) {
    if (note.accidental === null && Math.random() < 0.3) {
      note.accidental = Math.random() < 0.5 ? '#' : 'b'
    }
  }

  return intervals
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