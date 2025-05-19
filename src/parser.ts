#!/usr/bin/env ts-node

import { Buffer } from "node:buffer";

const CHUNK_SIZE = 188;
const SYNC_BYTE = 0x47;

let buffer = Buffer.alloc(0);
let isSynchronized = false;
let overallPosition = 0;
let packetCount = 0;

process.stdin.on("data", (chunk: Buffer) => {
  console.log(`Received ${chunk.length} bytes`);

  buffer = Buffer.concat([buffer, chunk]);

  // First part of stream may be a partial packet, so check each byte until
  // first sync byte found
  if (!isSynchronized) {
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === SYNC_BYTE) {
        isSynchronized = true;
        overallPosition = i;
        console.log(`Synchronized at offset ${overallPosition + i}`);
        break;
      }
    }
  }

  // If still not synchronized.... TO-DO: handle this case

  while (buffer.length > CHUNK_SIZE) {
    if (buffer[0] !== SYNC_BYTE) {
      console.error(`Error: No sync byte present in packet ${packetCount}`);
      process.exit(1);
    }

    const currentChunk = buffer.subarray(0, CHUNK_SIZE);
    // Do something with the current chunk
    console.log(`At position ${overallPosition}`);

    buffer = buffer.subarray(CHUNK_SIZE);
    overallPosition += CHUNK_SIZE;
  }
});

process.stdin.on("end", () => {
  if (buffer.length > 0) {
    console.log(`File ended with incomplete chunk of ${buffer.length} bytes`);
  }

  console.error(`Processed ${overallPosition} bytes (${Math.floor(overallPosition / CHUNK_SIZE)} complete chunks)`);
});
