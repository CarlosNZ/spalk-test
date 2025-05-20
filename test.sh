echo "\n\n1. Parsing valid stream...\n"
cat artifacts/test_success.ts | node dist/parser.js

echo "\n\n2. Parsing invalid stream...\n"
cat artifacts/test_failure.ts | node dist/parser.js

echo "\n\n3. Parsing valid stream with a partial first packet...\n"
cat artifacts/test_success_partial_first_packet.ts | node dist/parser.js

echo "\n\n4. Parsing invalid stream - no sync byte within first full packet...\n"
cat artifacts/test_failure_sync_over_188.ts | node dist/parser.js

echo "\n\n5. Parsing valid stream where first sync byte is actually part of payload...\n"
cat artifacts/test_success_sync_byte_is_valid_payload.ts | node dist/parser.js

echo "\n\n6. Try parsing a file smaller than 4 packets...\n"
cat artifacts/success_output.txt | node dist/parser.js
