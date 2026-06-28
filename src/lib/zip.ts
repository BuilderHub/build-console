// Minimal dependency-free ZIP writer (stored / no compression). Sufficient for
// bundling a handful of small text files (e.g. mTLS PEMs) into one download.

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

export interface ZipEntry {
  name: string
  content: string
}

interface PreparedEntry {
  nameBytes: Uint8Array
  data: Uint8Array
  crc: number
  offset: number
}

/** Build a ZIP archive (no compression) from the given text entries. */
export function createZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder()

  const prepared: PreparedEntry[] = []
  let localSize = 0
  let centralSize = 0
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const data = encoder.encode(entry.content)
    prepared.push({ nameBytes, data, crc: crc32(data), offset: localSize })
    localSize += 30 + nameBytes.length + data.length
    centralSize += 46 + nameBytes.length
  }

  const out = new Uint8Array(localSize + centralSize + 22)
  const view = new DataView(out.buffer)
  let pos = 0

  for (const { nameBytes, data, crc } of prepared) {
    view.setUint32(pos, 0x04034b50, true) // local file header signature
    view.setUint16(pos + 4, 20, true) // version needed
    view.setUint16(pos + 6, 0, true) // flags
    view.setUint16(pos + 8, 0, true) // method: stored
    view.setUint16(pos + 10, 0, true) // mod time
    view.setUint16(pos + 12, 0, true) // mod date
    view.setUint32(pos + 14, crc, true)
    view.setUint32(pos + 18, data.length, true) // compressed size
    view.setUint32(pos + 22, data.length, true) // uncompressed size
    view.setUint16(pos + 26, nameBytes.length, true)
    view.setUint16(pos + 28, 0, true) // extra length
    out.set(nameBytes, pos + 30)
    out.set(data, pos + 30 + nameBytes.length)
    pos += 30 + nameBytes.length + data.length
  }

  for (const { nameBytes, data, crc, offset } of prepared) {
    view.setUint32(pos, 0x02014b50, true) // central directory signature
    view.setUint16(pos + 4, 20, true) // version made by
    view.setUint16(pos + 6, 20, true) // version needed
    view.setUint16(pos + 8, 0, true) // flags
    view.setUint16(pos + 10, 0, true) // method
    view.setUint16(pos + 12, 0, true) // mod time
    view.setUint16(pos + 14, 0, true) // mod date
    view.setUint32(pos + 16, crc, true)
    view.setUint32(pos + 20, data.length, true)
    view.setUint32(pos + 24, data.length, true)
    view.setUint16(pos + 28, nameBytes.length, true)
    view.setUint16(pos + 30, 0, true) // extra length
    view.setUint16(pos + 32, 0, true) // comment length
    view.setUint16(pos + 34, 0, true) // disk number
    view.setUint16(pos + 36, 0, true) // internal attrs
    view.setUint32(pos + 38, 0, true) // external attrs
    view.setUint32(pos + 42, offset, true) // local header offset
    out.set(nameBytes, pos + 46)
    pos += 46 + nameBytes.length
  }

  view.setUint32(pos, 0x06054b50, true) // end of central directory signature
  view.setUint16(pos + 4, 0, true) // disk number
  view.setUint16(pos + 6, 0, true) // central dir disk
  view.setUint16(pos + 8, entries.length, true) // entries on disk
  view.setUint16(pos + 10, entries.length, true) // total entries
  view.setUint32(pos + 12, centralSize, true)
  view.setUint32(pos + 16, localSize, true) // central dir offset
  view.setUint16(pos + 20, 0, true) // comment length

  return new Blob([out], { type: 'application/zip' })
}
