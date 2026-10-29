import { useEffect, useRef, useState } from 'react'
import type { GeneratedWorksheet } from './music'

function createStaveNote(
  StaveNote: typeof import('vexflow').StaveNote,
  Accidental: typeof import('vexflow').Accidental,
  letter: string,
  octave: number,
  accidental: '#' | 'b' | 'n' | null,
) {
  const note = new StaveNote({ keys: [`${letter}/${octave}`], duration: 'q' })
  if (accidental) note.addModifier(new Accidental(accidental), 0)
  return note
}

export function WorksheetStaff({ worksheet }: { worksheet: GeneratedWorksheet }) {
  const staffRef = useRef<HTMLDivElement>(null)
  const [renderFailed, setRenderFailed] = useState(false)

  useEffect(() => {
    const element = staffRef.current
    if (!element) return
    let disposed = false
    let renderVersion = 0

    const drawStaff = async () => {
      const currentVersion = ++renderVersion
      const { Accidental, BarlineType, Formatter, Renderer, Stave, StaveNote, Voice } = await import('vexflow')
      if (disposed || currentVersion !== renderVersion) return

      const measuresPerRow = worksheet.measuresPerRow
      const lineWidth = Math.max(element.clientWidth, measuresPerRow * 130)
      const rightPadding = 8
      const width = lineWidth + rightPadding
      const measures = Array.from({ length: Math.ceil(worksheet.notes.length / worksheet.beatsPerMeasure) }, (_, index) =>
        worksheet.notes.slice(index * worksheet.beatsPerMeasure, (index + 1) * worksheet.beatsPerMeasure),
      )
      const rowCount = Math.ceil(measures.length / measuresPerRow)
      const rowHeight = 176
      element.replaceChildren()

      try {
        const renderer = new Renderer(element, Renderer.Backends.SVG)
        renderer.resize(width, rowCount * rowHeight + 20)
        const context = renderer.getContext()

        measures.forEach((notes, measureIndex) => {
          const row = Math.floor(measureIndex / measuresPerRow)
          const column = measureIndex % measuresPerRow
          const firstMeasureIndex = row * measuresPerRow
          const measuresInRow = Math.min(measuresPerRow, measures.length - firstMeasureIndex)
          const nominalMeasureWidth = lineWidth / measuresInRow
          const firstNoteStartOffset = Math.min(112, nominalMeasureWidth * 0.34)
          const firstMeasureExtra = measuresInRow > 1 ? firstNoteStartOffset - 24 : 0
          const regularMeasureWidth = (lineWidth - firstMeasureExtra) / measuresInRow
          const measureWidth = column === 0 ? regularMeasureWidth + firstMeasureExtra : regularMeasureWidth
          const x = column === 0 ? 0 : firstMeasureExtra + column * regularMeasureWidth
          const y = row * rowHeight + 30
          const startsSystem = column === 0
          const endsLine = column === measuresPerRow - 1 || measureIndex === measures.length - 1
          const isFinalMeasure = measureIndex === measures.length - 1
          const stave = new Stave(x, y, measureWidth)

          if (startsSystem) {
            stave.addClef('treble').addTimeSignature(`${worksheet.beatsPerMeasure}/4`)
            if (worksheet.accidentalMode === 'key') stave.addKeySignature(worksheet.keySignature)
          }
          if (endsLine) stave.setEndBarType(isFinalMeasure ? BarlineType.END : BarlineType.SINGLE)

          stave.setContext(context).draw()
          const noteStartOffset = startsSystem ? firstNoteStartOffset : 24
          stave.setNoteStartX(x + noteStartOffset)

          const tickables = notes.map((note) => createStaveNote(StaveNote, Accidental, note.letter, note.octave, note.accidental))
          const voice = new Voice({ numBeats: notes.length, beatValue: 4 })
          voice.addTickables(tickables)
          new Formatter().joinVoices([voice]).format([voice], Math.max(measureWidth - noteStartOffset - 20, 40))
          voice.draw(context, stave)
        })

        setRenderFailed(false)
      } catch (error) {
        console.error('VexFlow konnte das Übungsblatt nicht zeichnen.', error)
        setRenderFailed(true)
      }
    }

    drawStaff()
    const observer = new ResizeObserver(drawStaff)
    observer.observe(element)
    return () => {
      disposed = true
      observer.disconnect()
    }
  }, [worksheet])

  const accessibleNotes = worksheet.notes
    .map(({ letter, octave, accidental }) => `${letter}${accidental ?? ''}${octave}`)
    .join(', ')

  return (
    <div className="worksheet-staff-wrap">
      {renderFailed
        ? <p className="staff-error" role="alert">Das Notenblatt konnte nicht dargestellt werden.</p>
        : <div className="worksheet-staff" ref={staffRef} role="img" aria-label={`Notenblatt im Violinschlüssel: ${accessibleNotes}`} />}
    </div>
  )
}