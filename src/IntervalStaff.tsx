import { useEffect, useRef, useState } from 'react'
import type { GeneratedInterval, IntervalClef } from './music'

export function IntervalStaff({
  intervals,
  clef,
  measuresPerRow,
}: {
  intervals: GeneratedInterval[]
  clef: IntervalClef
  measuresPerRow: number
}) {
  const staffRef = useRef<HTMLDivElement>(null)
  const [renderFailed, setRenderFailed] = useState(false)

  useEffect(() => {
    const element = staffRef.current
    if (!element) return
    let disposed = false
    let renderVersion = 0

    const drawStaff = async () => {
      const currentVersion = ++renderVersion

      try {
        const { Accidental, BarlineType, Formatter, Renderer, Stave, StaveNote, Voice } = await import('vexflow')
        if (disposed || currentVersion !== renderVersion) return

        const measures = Array.from({ length: Math.ceil(intervals.length / 4) }, (_, index) =>
          intervals.slice(index * 4, (index + 1) * 4),
        )
        const rowCount = Math.ceil(measures.length / measuresPerRow)
        const lineWidth = Math.max(element.clientWidth, measuresPerRow * 190)
        const width = lineWidth + 8
        const rowHeight = 132
        element.replaceChildren()

        const renderer = new Renderer(element, Renderer.Backends.SVG)
        renderer.resize(width, rowCount * rowHeight + 20)
        const context = renderer.getContext()

        measures.forEach((measureIntervals, measureIndex) => {
          const row = Math.floor(measureIndex / measuresPerRow)
          const column = measureIndex % measuresPerRow
          const firstMeasureIndex = row * measuresPerRow
          const measuresInRow = Math.min(measuresPerRow, measures.length - firstMeasureIndex)
          const nominalMeasureWidth = lineWidth / measuresInRow
          const firstNoteStartOffset = Math.min(112, nominalMeasureWidth * 0.5)
          const firstMeasureExtra = measuresInRow > 1 ? firstNoteStartOffset - 24 : 0
          const regularMeasureWidth = (lineWidth - firstMeasureExtra) / measuresInRow
          const measureWidth = column === 0 ? regularMeasureWidth + firstMeasureExtra : regularMeasureWidth
          const x = column === 0 ? 0 : firstMeasureExtra + column * regularMeasureWidth
          const y = row * rowHeight + 24
          const startsSystem = column === 0
          const endsLine = column === measuresPerRow - 1 || measureIndex === measures.length - 1
          const isFinalMeasure = measureIndex === measures.length - 1
          const stave = new Stave(x, y, measureWidth)

          if (startsSystem) stave.addClef(clef).addTimeSignature('4/4')
          if (endsLine) stave.setEndBarType(isFinalMeasure ? BarlineType.END : BarlineType.SINGLE)

          stave.setContext(context).draw()
          const noteStartOffset = startsSystem ? firstNoteStartOffset : 24
          stave.setNoteStartX(x + noteStartOffset)

          const tickables = Array.from({ length: 4 }, (_, beatIndex) => {
            const interval = measureIntervals[beatIndex]
            if (!interval) return new StaveNote({ keys: ['b/4'], duration: 'qr', clef })

            const notes = interval.size === 1 ? [interval.lower] : [interval.lower, interval.upper]
            const note = new StaveNote({
              keys: notes.map(({ letter, octave }) => `${letter}/${octave}`),
              duration: 'q',
              clef,
            })
            notes.forEach(({ accidental }, noteIndex) => {
              if (accidental === '#' || accidental === 'b') {
                note.addModifier(new Accidental(accidental), noteIndex)
              }
            })
            return note
          })
          const voice = new Voice({ numBeats: 4, beatValue: 4 })
          voice.addTickables(tickables)
          new Formatter().joinVoices([voice]).format([voice], Math.max(measureWidth - noteStartOffset - 20, 40))
          voice.draw(context, stave)
        })

        setRenderFailed(false)
      } catch (error) {
        if (disposed || currentVersion !== renderVersion) return
        console.error('VexFlow konnte das Intervallblatt nicht zeichnen.', error)
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
  }, [intervals, clef, measuresPerRow])

  return (
    <div className="interval-score">
      {renderFailed
        ? <p className="staff-error" role="alert">Das Intervallblatt konnte nicht dargestellt werden.</p>
        : <div
          className="interval-score-staff"
          ref={staffRef}
          role="img"
          aria-label={`Intervallblatt mit ${intervals.length} Aufgaben im 4/4-Takt, ${clef === 'treble' ? 'Violinschlüssel' : 'Bassschlüssel'}`}
        />}
    </div>
  )
}
