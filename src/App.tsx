import { useEffect, useState } from 'react'
import { IntervalStaff } from './IntervalStaff'
import { WorksheetStaff } from './WorksheetStaff'
import { createRandomIntervals, createRandomWorksheet, intervalNames, type AccidentalMode, type GeneratedInterval, type GeneratedWorksheet, type IntervalClef } from './music'

type KeySignature = {
  id: string
  label: string
  notation: string
  count: number
  direction: 'sharp' | 'flat' | 'none'
}

const keySignatures: KeySignature[] = [
  { id: 'C', label: 'C-Dur / a-Moll', notation: 'C / Am', count: 0, direction: 'none' },
  { id: 'G', label: 'G-Dur / e-Moll', notation: 'G / Em', count: 1, direction: 'sharp' },
  { id: 'D', label: 'D-Dur / h-Moll', notation: 'D / Bm', count: 2, direction: 'sharp' },
  { id: 'A', label: 'A-Dur / fis-Moll', notation: 'A / F#m', count: 3, direction: 'sharp' },
  { id: 'E', label: 'E-Dur / cis-Moll', notation: 'E / C#m', count: 4, direction: 'sharp' },
  { id: 'B', label: 'H-Dur / gis-Moll', notation: 'B / G#m', count: 5, direction: 'sharp' },
  { id: 'F#', label: 'Fis-Dur / dis-Moll', notation: 'F# / D#m', count: 6, direction: 'sharp' },
  { id: 'F', label: 'F-Dur / d-Moll', notation: 'F / Dm', count: 1, direction: 'flat' },
  { id: 'Bb', label: 'B-Dur / g-Moll', notation: 'Bb / Gm', count: 2, direction: 'flat' },
  { id: 'Eb', label: 'Es-Dur / c-Moll', notation: 'Eb / Cm', count: 3, direction: 'flat' },
  { id: 'Ab', label: 'As-Dur / f-Moll', notation: 'Ab / Fm', count: 4, direction: 'flat' },
  { id: 'Db', label: 'Des-Dur / b-Moll', notation: 'Db / Bbm', count: 5, direction: 'flat' },
  { id: 'Gb', label: 'Ges-Dur / es-Moll', notation: 'Gb / Ebm', count: 6, direction: 'flat' },
]

const pitches = Array.from({ length: 5 }, (_, octaveIndex) => {
  const octave = octaveIndex + 3
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => `${letter}${octave}`)
}).flat()

const accidentalModes: { value: AccidentalMode; title: string; detail: string }[] = [
  { value: 'none', title: 'Keine', detail: 'Nur Stammtöne' },
  { value: 'single', title: 'Einzeln', detail: 'Vorzeichen an der Note' },
  { value: 'key', title: 'Generalvorzeichen', detail: 'Tonart auswählen' },
]

function WorksheetConfigurator() {
  const [noteCountInput, setNoteCountInput] = useState('16')
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4)
  const [measuresPerRow, setMeasuresPerRow] = useState(2)
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>('none')
  const [keySignatureId, setKeySignatureId] = useState('G')
  const [lowestPitch, setLowestPitch] = useState('C4')
  const [highestPitch, setHighestPitch] = useState('C6')
  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null)

  const noteCount = Number(noteCountInput)
  const validNoteCount = Number.isInteger(noteCount) && noteCount >= 1 && noteCount <= 64
  const safeNoteCount = validNoteCount ? noteCount : 1
  const measureCount = Math.ceil(safeNoteCount / beatsPerMeasure)
  const fullMeasures = Math.floor(safeNoteCount / beatsPerMeasure)
  const notesInLastMeasure = safeNoteCount % beatsPerMeasure
  const worksheetMeasureCount = worksheet
    ? Math.ceil(worksheet.notes.length / worksheet.beatsPerMeasure)
    : 0
  const activeKey = keySignatures.find((key) => key.id === keySignatureId) ?? keySignatures[0]
  const lowestIndex = pitches.indexOf(lowestPitch)
  const highestIndex = pitches.indexOf(highestPitch)
  const validPitchRange = lowestIndex >= 0 && highestIndex >= lowestIndex

  function changeLowestPitch(value: string) {
    setLowestPitch(value)
    if (pitches.indexOf(value) > highestIndex) setHighestPitch(value)
    setWorksheet(null)
  }

  function changeHighestPitch(value: string) {
    setHighestPitch(value)
    if (pitches.indexOf(value) < lowestIndex) setLowestPitch(value)
    setWorksheet(null)
  }

  function generateWorksheet() {
    if (!validNoteCount || !validPitchRange) return
    const totalMeasures = Math.ceil(noteCount / beatsPerMeasure)
    const selectedMeasuresPerRow = Math.min(measuresPerRow, totalMeasures)
    setMeasuresPerRow(selectedMeasuresPerRow)
    setWorksheet(createRandomWorksheet(noteCount, beatsPerMeasure, accidentalMode, keySignatureId, lowestPitch, highestPitch, selectedMeasuresPerRow))
  }

  function changeWorksheetMeasuresPerRow(count: number) {
    setMeasuresPerRow(count)
    setWorksheet((current) => current ? { ...current, measuresPerRow: count } : current)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lehrkraftstudio, Startseite">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>lehrkraft<span className="brand-accent">.</span></span>
        </a>
        <a className="topbar-label breadcrumb-link" href="/">← ALLE ANWENDUNGEN</a>
      </header>

      <main id="konfiguration">
        <section className="page-heading" aria-labelledby="page-title">
          <div className="heading-copy">
            <p className="eyebrow"><span className="eyebrow-index">01</span> NEUES ÜBUNGSBLATT</p>
            <h1 id="page-title">Notenblatt <em>konfigurieren</em></h1>
            <p className="page-description">Lege Tonumfang, Takt und Vorzeichen für deine Notenübung fest.</p>
          </div>
          <div className="clef-stamp" aria-hidden="true"><span>𝄞</span><small>VIOLINSCHLÜSSEL</small></div>
        </section>

        <div className="workspace">
          <form className="settings-form" onSubmit={(event) => event.preventDefault()}>
            <section className="form-section" aria-labelledby="amount-title">
              <div className="section-heading">
                <span className="section-number">01</span>
                <div>
                  <h2 id="amount-title">Umfang</h2>
                  <p>Wie viele Viertelnoten soll die Übung enthalten?</p>
                </div>
              </div>
              <div className="amount-control">
                <label htmlFor="note-count">Anzahl der Noten</label>
                <div className="number-input-wrap">
                  <input
                    id="note-count"
                    type="number"
                    min="1"
                    max="64"
                    step="1"
                    value={noteCountInput}
                    onChange={(event) => {
                      setNoteCountInput(event.target.value)
                      setWorksheet(null)
                    }}
                    aria-describedby="count-help count-error"
                  />
                  <span>Viertelnoten</span>
                </div>
                <small id="count-help">1 bis 64 Noten pro Übung</small>
                {!validNoteCount && <small id="count-error" className="field-error">Bitte gib eine ganze Zahl zwischen 1 und 64 ein.</small>}
              </div>
            </section>

            <section className="form-section" aria-labelledby="meter-title">
              <div className="section-heading">
                <span className="section-number">02</span>
                <div>
                  <h2 id="meter-title">Taktart</h2>
                  <p>Der Nenner bleibt bei Viertelnoten auf 4.</p>
                </div>
              </div>
              <div className="meter-options" role="group" aria-label="Taktart auswählen">
                {[2, 3, 4, 5, 6, 7].map((beats) => (
                  <button
                    key={beats}
                    type="button"
                    className={`meter-option${beatsPerMeasure === beats ? ' is-selected' : ''}`}
                    onClick={() => {
                      setBeatsPerMeasure(beats)
                      setWorksheet(null)
                    }}
                    aria-pressed={beatsPerMeasure === beats}
                    aria-label={`${beats} Viertel, ${beats}/4`}
                  >
                    <span>{beats}</span><span className="meter-rule" /><span>4</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="form-section" aria-labelledby="accidental-title">
              <div className="section-heading">
                <span className="section-number">03</span>
                <div>
                  <h2 id="accidental-title">Vorzeichen</h2>
                  <p>Wähle, wie Vorzeichen in der Übung vorkommen.</p>
                </div>
              </div>
              <fieldset className="mode-options">
                <legend className="sr-only">Vorzeichenmodus</legend>
                {accidentalModes.map((mode) => (
                  <label key={mode.value} className={`mode-option${accidentalMode === mode.value ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="accidental-mode"
                      value={mode.value}
                      checked={accidentalMode === mode.value}
                      onChange={() => {
                        setAccidentalMode(mode.value)
                        setWorksheet(null)
                      }}
                    />
                    <span className="mode-symbol" aria-hidden="true">{mode.value === 'none' ? '♮' : mode.value === 'single' ? '♯♭' : '𝄞'}</span>
                    <span className="mode-copy"><strong>{mode.title}</strong><small>{mode.detail}</small></span>
                    <span className="radio-indicator" aria-hidden="true" />
                  </label>
                ))}
              </fieldset>

              {accidentalMode === 'key' && (
                <div className="key-select-wrap">
                  <label htmlFor="key-signature">Tonart</label>
                  <select id="key-signature" value={keySignatureId} onChange={(event) => {
                    setKeySignatureId(event.target.value)
                    setWorksheet(null)
                  }}>
                    {keySignatures.map((key) => (
                      <option key={key.id} value={key.id}>{key.label}</option>
                    ))}
                  </select>
                  <small>Bis zu sechs Kreuze oder Bs.</small>
                </div>
              )}
            </section>

            <section className="form-section range-section" aria-labelledby="range-title">
              <div className="section-heading">
                <span className="section-number">04</span>
                <div>
                  <h2 id="range-title">Tonumfang</h2>
                  <p>Die Grenzen sind eingeschlossen.</p>
                </div>
              </div>
              <div className="range-controls">
                <div className="select-field">
                  <label htmlFor="lowest-pitch">Von</label>
                  <select id="lowest-pitch" value={lowestPitch} onChange={(event) => changeLowestPitch(event.target.value)}>
                    {pitches.filter((pitch) => pitches.indexOf(pitch) <= highestIndex).map((pitch) => <option key={pitch}>{pitch}</option>)}
                  </select>
                </div>
                <span className="range-arrow" aria-hidden="true">→</span>
                <div className="select-field">
                  <label htmlFor="highest-pitch">Bis</label>
                  <select id="highest-pitch" value={highestPitch} onChange={(event) => changeHighestPitch(event.target.value)}>
                    {pitches.filter((pitch) => pitches.indexOf(pitch) >= lowestIndex).map((pitch) => <option key={pitch}>{pitch}</option>)}
                  </select>
                </div>
              </div>
              <small className="range-help">Oktavzahlen nach VexFlow, zum Beispiel C4 bis C5.</small>
              {!validPitchRange && <small className="field-error">Der obere Ton muss mindestens so hoch wie der untere Ton sein.</small>}
            </section>

          </form>

          <aside className="summary-panel" aria-labelledby="summary-title" aria-live="polite">
            <div className="summary-topline"><span>AKTUELLE EINSTELLUNGEN</span><span className="status-dot" /></div>
            <h2 id="summary-title">Dein Übungsblatt</h2>
            <div className="summary-stats">
              <div className="summary-stat"><strong>{validNoteCount ? noteCount : '—'}</strong><span>Viertelnoten</span></div>
              <div className="summary-divider" />
                <div className="summary-stat"><strong>{validNoteCount ? measureCount : '—'}</strong><span>{validNoteCount && measureCount === 1 ? 'Takt' : 'Takte'}</span></div>
            </div>

            <div className="summary-detail-list">
              <div className="summary-detail"><span>Taktart</span><strong>{beatsPerMeasure}/4</strong></div>
              <div className="summary-detail"><span>Tonumfang</span><strong>{validPitchRange ? `${lowestPitch} – ${highestPitch}` : '—'}</strong></div>
              <div className="summary-detail"><span>Vorzeichen</span><strong>{accidentalMode === 'none' ? 'Keine' : accidentalMode === 'single' ? 'Einzelne' : activeKey.label}</strong></div>
            </div>

            <div className="measure-plan">
              <div className="measure-plan-heading"><span>TAKTPLAN</span><span>{beatsPerMeasure} Viertel je Takt</span></div>
              <div className="measure-grid" aria-label={`${validNoteCount ? measureCount : 0} Takte mit jeweils bis zu ${beatsPerMeasure} Viertelnoten`}>
                {validNoteCount && Array.from({ length: measureCount }, (_, measureIndex) => {
                  const notesInMeasure = Math.min(beatsPerMeasure, noteCount - measureIndex * beatsPerMeasure)
                  return (
                    <div className="measure-item" key={measureIndex} aria-label={`Takt ${measureIndex + 1}: ${notesInMeasure} von ${beatsPerMeasure} Viertelnoten`}>
                      <span className="measure-number">{String(measureIndex + 1).padStart(2, '0')}</span>
                      <span className="beat-track" aria-hidden="true">
                        {Array.from({ length: beatsPerMeasure }, (_, beatIndex) => (
                          <i key={beatIndex} className={beatIndex < notesInMeasure ? 'beat-filled' : ''} />
                        ))}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="measure-caption">
                {!validNoteCount
                  ? 'Prüfe die Anzahl der Noten.'
                  : notesInLastMeasure === 0
                    ? `${fullMeasures} volle ${fullMeasures === 1 ? 'Takt' : 'Takte'}.`
                    : `${fullMeasures > 0 ? `${fullMeasures} volle ${fullMeasures === 1 ? 'Takt' : 'Takte'} + ` : ''}${notesInLastMeasure} ${notesInLastMeasure === 1 ? 'Note' : 'Noten'} im Schlusstakt.`}
              </p>
            </div>

            {accidentalMode === 'key' && (
              <div className="key-preview">
                <span className="key-preview-symbol" aria-hidden="true">
                  {activeKey.direction === 'sharp' ? '♯' : activeKey.direction === 'flat' ? '♭' : '♮'}
                </span>
                <span><strong>{activeKey.label}</strong><small>{activeKey.count === 0 ? 'Keine Vorzeichen' : `${activeKey.count} ${activeKey.direction === 'sharp' ? 'Kreuz' : 'B'}${activeKey.count === 1 ? '' : activeKey.direction === 'sharp' ? 'e' : 's'}`}</small></span>
                <span className="key-notation">{activeKey.notation}</span>
              </div>
            )}

            <button
              className="generate-button"
              type="button"
              onClick={generateWorksheet}
              disabled={!validNoteCount || !validPitchRange}
            >
              <span aria-hidden="true">✦</span>
              {worksheet ? 'Neu generieren' : 'Übungsblatt generieren'}
            </button>
          </aside>
        </div>

        {worksheet && (
          <section className="generated-worksheet" aria-labelledby="generated-title">
            <div className="generated-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-index">02</span> ZUFÄLLIGE NOTENFOLGE</p>
                <h2 id="generated-title">Dein <em>Übungsblatt</em></h2>
                <p>{worksheet.notes.length} Viertelnoten · {worksheet.beatsPerMeasure}/4 · {worksheet.measuresPerRow} Takte je Zeile · {worksheet.lowestPitch} bis {worksheet.highestPitch}</p>
              </div>
              <div className="generated-tools">
                <span className="generated-mode">{worksheet.accidentalMode === 'key' ? keySignatures.find((key) => key.id === worksheet.keySignature)?.label : accidentalModes.find((mode) => mode.value === worksheet.accidentalMode)?.title}</span>
                <label className="generated-layout-control">
                  <span>TAKTE PRO ZEILE</span>
                  <select
                    aria-label="Takte pro Zeile im Übungsblatt"
                    value={worksheet.measuresPerRow}
                    onChange={(event) => changeWorksheetMeasuresPerRow(Number(event.target.value))}
                  >
                    {Array.from({ length: worksheetMeasureCount }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count} {count === 1 ? 'Takt' : 'Takte'}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <WorksheetStaff worksheet={worksheet} />
          </section>
        )}
      </main>

      <footer className="page-footer"><span>LEHRKRAFTSTUDIO <i /> NOTENBLATTWERKSTATT</span><span>VIOLINSCHLÜSSEL · VIERTELNOTEN</span></footer>
    </div>
  )
}

function IntervalGenerator() {
  const [countInput, setCountInput] = useState('12')
  const [selectedSizes, setSelectedSizes] = useState<number[]>([2, 3, 4, 5])
  const [clef, setClef] = useState<IntervalClef>('treble')
  const [measuresPerRow, setMeasuresPerRow] = useState(2)
  const [intervals, setIntervals] = useState<GeneratedInterval[] | null>(null)
  const count = Number(countInput)
  const validCount = Number.isInteger(count) && count >= 1 && count <= 64
  const intervalMeasureCount = intervals ? Math.ceil(intervals.length / 4) : 0

  function toggleSize(size: number) {
    setSelectedSizes((current) => current.includes(size)
      ? current.filter((value) => value !== size)
      : [...current, size].sort((a, b) => a - b))
    setIntervals(null)
  }

  function generateIntervals() {
    if (!validCount || selectedSizes.length === 0) return
    const nextIntervals = createRandomIntervals(count, selectedSizes, clef)
    setMeasuresPerRow((current) => Math.min(current, Math.ceil(nextIntervals.length / 4)))
    setIntervals(nextIntervals)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lehrkraftstudio, Startseite">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>lehrkraft<span className="brand-accent">.</span></span>
        </a>
        <a className="topbar-label breadcrumb-link" href="/">← ALLE ANWENDUNGEN</a>
      </header>

      <main>
        <section className="page-heading" aria-labelledby="interval-page-title">
          <div className="heading-copy">
            <p className="eyebrow"><span className="eyebrow-index">02</span> GEHÖRBILDUNG &amp; NOTENLEHRE</p>
            <h1 id="interval-page-title">Intervalle <em>generieren</em></h1>
            <p className="page-description">Stelle dir zufällige Intervalle im Violin- oder Bassschlüssel zusammen.</p>
          </div>
          <div className="clef-stamp" aria-hidden="true"><span>{clef === 'treble' ? '𝄞' : '𝄢'}</span><small>{clef === 'treble' ? 'VIOLINSCHLÜSSEL' : 'BASSSCHLÜSSEL'}</small></div>
        </section>

        <div className="workspace interval-workspace">
          <form className="settings-form" onSubmit={(event) => event.preventDefault()}>
            <section className="form-section interval-form-section" aria-labelledby="interval-count-title">
              <div className="section-heading">
                <span className="section-number">01</span>
                <div>
                  <h2 id="interval-count-title">Anzahl</h2>
                  <p>Wie viele Intervalle sollen angezeigt werden?</p>
                </div>
              </div>
              <div className="amount-control">
                <label htmlFor="interval-count">Anzahl der Intervalle</label>
                <div className="number-input-wrap">
                  <input
                    id="interval-count"
                    type="number"
                    min="1"
                    max="64"
                    step="1"
                    value={countInput}
                    onChange={(event) => {
                      setCountInput(event.target.value)
                      setIntervals(null)
                    }}
                    aria-describedby="interval-count-help interval-count-error"
                  />
                  <span>Intervalle</span>
                </div>
                <small id="interval-count-help">1 bis 64 Intervalle pro Blatt</small>
                {!validCount && <small id="interval-count-error" className="field-error">Bitte gib eine ganze Zahl zwischen 1 und 64 ein.</small>}
              </div>
            </section>

            <section className="form-section interval-form-section" aria-labelledby="clef-title">
              <div className="section-heading">
                <span className="section-number">02</span>
                <div>
                  <h2 id="clef-title">Notenschlüssel</h2>
                  <p>Wähle die Lage der Noten auf dem System.</p>
                </div>
              </div>
              <fieldset className="clef-options" aria-label="Notenschlüssel auswählen">
                {([
                  { value: 'treble', title: 'Violinschlüssel', symbol: '𝄞' },
                  { value: 'bass', title: 'Bassschlüssel', symbol: '𝄢' },
                ] as const).map((option) => (
                  <label key={option.value} className={`mode-option${clef === option.value ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="interval-clef"
                      value={option.value}
                      checked={clef === option.value}
                      onChange={() => {
                        setClef(option.value)
                        setIntervals(null)
                      }}
                    />
                    <span className="mode-symbol" aria-hidden="true">{option.symbol}</span>
                    <span className="mode-copy"><strong>{option.title}</strong><small>Noten im {option.value === 'treble' ? 'oberen' : 'unteren'} Register</small></span>
                    <span className="radio-indicator" aria-hidden="true" />
                  </label>
                ))}
              </fieldset>
            </section>

            <section className="form-section interval-form-section" aria-labelledby="interval-selection-title">
              <div className="section-heading">
                <span className="section-number">03</span>
                <div>
                  <h2 id="interval-selection-title">Intervalle</h2>
                  <p>Wähle die Intervallgrößen aus, die vorkommen dürfen.</p>
                </div>
              </div>
              <fieldset className="interval-choices" aria-describedby="interval-choice-help interval-choice-error">
                <legend className="sr-only">Mögliche Intervalle</legend>
                {intervalNames.map((name, index) => {
                  const size = index + 1
                  return (
                    <label className={`interval-choice${selectedSizes.includes(size) ? ' is-selected' : ''}`} key={size}>
                      <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />
                      <span className="interval-choice-number">{String(size).padStart(2, '0')}</span>
                      <span>{name}</span>
                    </label>
                  )
                })}
              </fieldset>
              <small id="interval-choice-help" className="interval-help">Diatonische Intervalle von der Prime bis zur Duodezime. Der höchste Ton ist c'''.</small>
              {selectedSizes.length === 0 && <small id="interval-choice-error" className="field-error">Wähle mindestens ein Intervall aus.</small>}
            </section>
          </form>

          <aside className="summary-panel interval-summary" aria-labelledby="interval-summary-title">
            <div className="summary-topline"><span>DEINE AUSWAHL</span><span className="status-dot" /></div>
            <h2 id="interval-summary-title">Intervallblatt</h2>
            <div className="summary-stats">
              <div className="summary-stat"><strong>{validCount ? count : '—'}</strong><span>Intervalle</span></div>
              <div className="summary-divider" />
              <div className="summary-stat"><strong>{selectedSizes.length}</strong><span>Intervallgrößen</span></div>
            </div>
            <div className="summary-detail-list">
              <div className="summary-detail"><span>Schlüssel</span><strong>{clef === 'treble' ? 'Violinschlüssel' : 'Bassschlüssel'}</strong></div>
              <div className="summary-detail"><span>Auswahl</span><strong>{selectedSizes.length === 0
                ? 'Keine'
                : selectedSizes.length <= 2
                  ? selectedSizes.map((size) => intervalNames[size - 1]).join(' · ')
                  : `${intervalNames[selectedSizes[0] - 1]} + ${selectedSizes.length - 1} weitere`}</strong></div>
            </div>
            <button className="generate-button" type="button" onClick={generateIntervals} disabled={!validCount || selectedSizes.length === 0}>
              <span aria-hidden="true">✦</span>
              {intervals ? 'Neu generieren' : 'Intervalle generieren'}
            </button>
          </aside>
        </div>

        {intervals && (
          <section className="generated-worksheet interval-results" aria-labelledby="interval-results-title">
            <div className="generated-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-index">02</span> ZUFÄLLIGE INTERVALLE</p>
                <h2 id="interval-results-title">Dein <em>Intervallblatt</em></h2>
                <p>{intervals.length} Intervalle · 4/4 · {clef === 'treble' ? 'Violinschlüssel' : 'Bassschlüssel'}</p>
              </div>
              <label className="generated-layout-control">
                <span>TAKTE PRO ZEILE</span>
                <select
                  aria-label="Takte pro Zeile im Intervallblatt"
                  value={Math.min(measuresPerRow, intervalMeasureCount)}
                  onChange={(event) => setMeasuresPerRow(Number(event.target.value))}
                >
                  {Array.from({ length: intervalMeasureCount }, (_, index) => index + 1).map((measureCount) => (
                    <option key={measureCount} value={measureCount}>{measureCount} {measureCount === 1 ? 'Takt' : 'Takte'}</option>
                  ))}
                </select>
              </label>
            </div>
            <IntervalStaff intervals={intervals} clef={clef} measuresPerRow={Math.min(measuresPerRow, intervalMeasureCount)} />
          </section>
        )}
      </main>

      <footer className="page-footer"><span>LEHRKRAFTSTUDIO <i /> INTERVALLWERKSTATT</span><span>VIOLIN- &amp; BASSSCHLÜSSEL</span></footer>
    </div>
  )
}

function HomePage() {
  return (
    <div className="app-shell home-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lehrkraftstudio, Startseite">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>lehrkraft<span className="brand-accent">.</span></span>
        </a>
        <span className="topbar-label">DEIN ARBEITSBEREICH <i /> MATERIALWERKSTATT</span>
      </header>

      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="eyebrow"><span className="eyebrow-index">✦</span> DEIN LEHRKRAFTSTUDIO</p>
            <h1 id="home-title">Gute Ideen.<br /><em>Gutes Material.</em></h1>
            <p className="home-intro">Praktische Werkzeuge, mit denen du Unterrichtsmaterial einfach vorbereitest und passend für deine Klasse gestaltest.</p>
            <a className="home-primary-link" href="/notenblatt">
              <span className="home-primary-number">01</span>
              <span>Zum Notenblatt konfigurieren</span>
              <span className="home-link-arrow" aria-hidden="true">↗</span>
            </a>
            <p className="home-first-note">Der erste Anwendungsfall ist bereit.</p>
          </div>
        </section>

        <section className="home-applications" aria-labelledby="applications-title">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow">WERKZEUGE FÜR DEINEN UNTERRICHT</p>
              <h2 id="applications-title">Anwendungen</h2>
            </div>
            <p>Wähle aus, womit du starten möchtest.</p>
          </div>
          <div className="applications-grid">
            <a className="application-card" href="/notenblatt">
              <span className="application-index">01</span>
              <span className="application-card-copy">
                <span className="application-category">MUSIK · ÜBUNGSBLATT</span>
                <strong>Notenblatt konfigurieren</strong>
                <span className="application-description">Erstelle ein individuelles Notenblatt mit passendem Tonumfang, Takt und Vorzeichen.</span>
              </span>
              <span className="application-open">Öffnen <span aria-hidden="true">↗</span></span>
            </a>
            <a className="application-card" href="/intervalle">
              <span className="application-index">02</span>
              <span className="application-card-copy">
                <span className="application-category">MUSIK · GEHÖRBILDUNG</span>
                <strong>Intervalle generieren</strong>
                <span className="application-description">Stelle zufällige Intervalle zusammen und wähle zwischen Violin- und Bassschlüssel.</span>
              </span>
              <span className="application-open">Öffnen <span aria-hidden="true">↗</span></span>
            </a>
          </div>
        </section>
      </main>

      <footer className="page-footer"><span>LEHRKRAFTSTUDIO <i /> MATERIALWERKSTATT</span><span>WERKZEUGE FÜR DEINEN UNTERRICHT</span></footer>
    </div>
  )
}

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  const isConfigurator = currentPath === '/notenblatt'
  const isIntervalGenerator = currentPath === '/intervalle'

  useEffect(() => {
    document.title = isConfigurator
      ? 'Notenblatt konfigurieren | Lehrkraftstudio'
      : isIntervalGenerator
        ? 'Intervalle generieren | Lehrkraftstudio'
        : 'Lehrkraftstudio | Materialwerkstatt'
  }, [isConfigurator, isIntervalGenerator])

  return isConfigurator ? <WorksheetConfigurator /> : isIntervalGenerator ? <IntervalGenerator /> : <HomePage />
}

export default App