import { execFile } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

export async function extractVideoFrame(videoBuffer: Buffer): Promise<Buffer> {
  const id = randomBytes(8).toString('hex')
  const inputPath = join(tmpdir(), `limauai-${id}.mp4`)
  const outputPath = join(tmpdir(), `limauai-${id}.jpg`)

  await writeFile(inputPath, videoBuffer)

  await new Promise<void>((resolve, reject) => {
    execFile('ffmpeg', [
      '-i', inputPath,
      '-ss', '00:00:02',
      '-vframes', '1',
      '-q:v', '2',
      '-y',
      outputPath,
    ], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  const frame = await readFile(outputPath)
  await Promise.allSettled([unlink(inputPath), unlink(outputPath)])
  return frame
}
