#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_buffer_1 = require("node:buffer");
const PACKET_SIZE = 188;
const SYNC_BYTE = 71;
const MIN_BUFFER_SIZE = 4 * PACKET_SIZE;
const DEBUG = false;
const debug = DEBUG ? console.log : () => { };
let buffer = node_buffer_1.Buffer.alloc(0);
let isSynchronized = false;
let currentOffset = 0;
let firstSyncByteOffset = 0;
const uniquePIDs = new Set();
process.stdin.on('data', (chunk) => {
    debug(`Received ${chunk.length} bytes`);
    buffer = node_buffer_1.Buffer.concat([buffer, chunk]);
    if (buffer.length < MIN_BUFFER_SIZE)
        return;
    if (!isSynchronized) {
        for (let i = 0; i < buffer.length; i++) {
            currentOffset = i;
            if (buffer[i] === SYNC_BYTE &&
                buffer[i + PACKET_SIZE] === SYNC_BYTE &&
                buffer[i + 2 * PACKET_SIZE] === SYNC_BYTE) {
                isSynchronized = true;
                firstSyncByteOffset = i;
                debug(`Synchronized at offset ${currentOffset}`);
                buffer = buffer.subarray(currentOffset);
                break;
            }
            if (i >= PACKET_SIZE) {
                const packetNum = (currentOffset - firstSyncByteOffset) / PACKET_SIZE;
                console.log(`Error: No sync byte present in packet ${packetNum}, offset ${currentOffset}`);
                process.exit(1);
            }
        }
        return;
    }
    debug(`Buffer length after sync: ${buffer.length}`);
    debug('Buffer 0', buffer[0]);
    while (buffer.length > PACKET_SIZE) {
        if (buffer[0] !== SYNC_BYTE) {
            const packetNum = (currentOffset - firstSyncByteOffset) / PACKET_SIZE;
            console.log(`Error: No sync byte present in packet ${packetNum}, offset ${currentOffset}`);
            process.exit(1);
        }
        const currentChunk = buffer.subarray(0, PACKET_SIZE);
        debug(`At position ${currentOffset}`);
        const pidByte1 = currentChunk[1];
        const pidByte2 = currentChunk[2];
        const last5BitsOfByte1 = pidByte1 & 0b00011111;
        const combined = (last5BitsOfByte1 << 8) | pidByte2;
        uniquePIDs.add(combined);
        buffer = buffer.subarray(PACKET_SIZE);
        currentOffset += PACKET_SIZE;
    }
});
process.stdin.on('end', () => {
    if (buffer.length > 0) {
        debug(`File ended with incomplete chunk of ${buffer.length} bytes`);
    }
    if (!isSynchronized) {
        console.log('Error: File ended without sync byte -- probably too small');
        process.exit(1);
    }
    const orderedPIDs = Array.from(uniquePIDs).sort();
    orderedPIDs.forEach(pid => {
        console.log(`0x${pid.toString(16)}`);
    });
    debug(`Processed ${currentOffset} bytes (${Math.floor(currentOffset / PACKET_SIZE)} complete chunks)`);
    process.exit(0);
});
