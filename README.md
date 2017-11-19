# word-encoder
Encode English words using fewer bytes with a bit-level protocol

# Usage

```
var wordEncoder = require('word-encoder'),
  encodedWords = wordEncoder.encodeList(aListOfWords),
  decodedWords = wordEncoder.decodeList(encodedWords);
```
## Protocol
Each word in a list of words is prefixed with a 1-byte frame that specifies the word's length (6 bits), whether the first letter is uppercase (a proper noun) and whether the word is composed solely of lowercase alphabets.

Words are encoded using a stream of characters and each character is encoded using 5 bits (1 << 5 === 32, enough to hold 26 letters).

##Framing
The longest word in the English dictionary is 45 letters long. For this reason, the first 6 bits (1 << 6 === 64) of the frame represent the word length. The 7th bit indicates whether the first letter in this word is uppercase (proper noun). The 8th bit is a special bit, which when set, specifies that the word cannot be encoded using this protocol.


Running the test on a list of words downloaded from http://www.cs.duke.edu/~ola/ap/linuxwords encodes 409057 bytes into 292464 bytes
