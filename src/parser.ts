#!/usr/bin/env ts-node

import { Buffer } from "node:buffer";

const CHUNK_SIZE = 188;
const SYNC_BYTE = 71; // 0x47;

const log = console.log;

let buffer = Buffer.alloc(0);
let isSynchronized = false;
let currentOffset = 0;
let firstSyncByteOffset = 0;
const uniquePIDs = new Set<number>();

process.stdin.on("data", (chunk: Buffer) => {
  // log(`Received ${chunk.length} bytes`);

  buffer = Buffer.concat([buffer, chunk]);

  // First part of stream may be a partial packet, so check each byte until
  // first sync byte found
  if (!isSynchronized) {
    for (let i = 0; i < buffer.length; i++) {
      currentOffset = i;
      if (buffer[i] === SYNC_BYTE) {
        isSynchronized = true;
        firstSyncByteOffset = i;
        log(`Synchronized at offset ${currentOffset}`);

        buffer = buffer.subarray(currentOffset);
        break;
      }
      if (i > CHUNK_SIZE) {
        log(`Error: No sync byte found in first full packet, offset ${currentOffset}`);
        process.exit(1);
      }
    }
  }

  log(`Buffer length after sync: ${buffer.length}`);
  log("Buffer 0", buffer[0]);

  // Sync byte found, process the remaining stream in chunks
  while (buffer.length > CHUNK_SIZE) {
    if (buffer[0] !== SYNC_BYTE) {
      log(
        `Error: No sync byte present in packet ${
          (currentOffset - firstSyncByteOffset) / CHUNK_SIZE
        }, offset ${currentOffset}`
      );
      process.exit(1);
    }

    const currentChunk = buffer.subarray(0, CHUNK_SIZE);
    // log(`At position ${currentOffset}`);

    const pidByte1 = currentChunk[1];
    const pidByte2 = currentChunk[2];

    const last5BitsOfByte1 = pidByte1 & 0b00011111;

    const combined = (last5BitsOfByte1 << 8) | pidByte2;

    // log(`Byte 1: ${byte1.toString(2)}, Byte 2: ${byte2.toString(2)}`);
    // log(`Combined: ${combined.toString(2)}`);

    uniquePIDs.add(combined);

    // Drop previous chunk from buffer to keep memory usage down
    buffer = buffer.subarray(CHUNK_SIZE);
    currentOffset += CHUNK_SIZE;
  }
});

process.stdin.on("end", () => {
  if (buffer.length > 0) {
    log(`File ended with incomplete chunk of ${buffer.length} bytes`);
  }

  const orderedPIDs = Array.from(uniquePIDs).sort();

  orderedPIDs.forEach((pid) => {
    // Print as Hex strings
    log(`0x${pid.toString(16)}`);
  });

  // console.log(`Processed ${currentByte} bytes (${Math.floor(currentByte / CHUNK_SIZE)} complete chunks)`);
});
