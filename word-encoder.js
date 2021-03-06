const FRAME_LENGTH = 1,
    CHAR_OFFSET = 97, //lowercase a
    BITS_PER_CHAR = 5;

function encode(word) {
    let bytesRequired = Math.ceil(word.length * 5 / 8),
        buffer = new Buffer(bytesRequired + FRAME_LENGTH),
        lastByte = 0,
        bitsWritten = 0,
        length = word.length,
        frame,
        currentByte;

    frame = buffer[0] = buildFrame(word);

    for (let i = 0, pos = 1; i < length; i ++) {
        let charCode = word[i].charCodeAt();
        if (charCode > 64 && charCode < 91 && i === 0) { //first character is uppercase. normalise
            charCode += CHAR_OFFSET - 65;
        } else if (charCode < CHAR_OFFSET || charCode > 122) { //word cannot be encoded using this protocol. Return the word unchanged prefixed with the frame
            frame |= 1; //set the last bit to indicate that the following word doesn't follow this protocol
            buffer = Buffer.concat([Buffer([frame]), Buffer(word)], length + 1);
            if (buffer.slice(1, length + 1).toString() !== word) throw 'wer';
            return buffer;
        }

        charCode -= CHAR_OFFSET;
        const bitsToTake = 8 - bitsWritten;

        if (bitsToTake < BITS_PER_CHAR) { //allocate a new byte
            const remainingBits = BITS_PER_CHAR - bitsToTake;
            currentByte = charCode >> remainingBits;
            lastByte |= currentByte;
            buffer[pos++] = lastByte;
            currentByte = (charCode & ((1 << remainingBits)) - 1) << (8 - remainingBits);
            lastByte = currentByte;
            bitsWritten = remainingBits;
        } else {
            const mask = 3 - bitsWritten;
            currentByte = charCode << mask;
            lastByte |= currentByte;
            bitsWritten += BITS_PER_CHAR;
        }
        if (i === length - 1) {
            buffer[pos] = lastByte;
        }
    }
    return buffer;
}


//word length must be explicitly specified. bytes.length * 8 / 5 wouldn't work as 2- and 3-character words are both encoded using 2 bytes
function decode(bytes, length, firstLetterIsUppercase) {
    var charCount = 0,
        mask = (1 << 5) - 1, //set 5 least significant bits
        word = new Uint8Array(length);

    while (charCount < length) {
        const nextByteIndex = Math.floor(charCount * 5 / 8);
        let shiftBy = (nextByteIndex + 2) * 8 - ((charCount + 1) * 5);
        let value;
        if (nextByteIndex === bytes.byteLength - 1) { //last byte
            value = bytes.getUint8(nextByteIndex);
            shiftBy -= 8;
        } else {
            value = bytes.getUint16(nextByteIndex);
        }
        let chr = ((value >> shiftBy) & mask) + CHAR_OFFSET; //reduce value to a 5-bit integer and add the character offset
        if (charCount === 0 && firstLetterIsUppercase) {
            chr -= CHAR_OFFSET - 65;
        }
        word[charCount] = chr;
        charCount++;
    }
    return String.fromCharCode.apply(null, word);
}

function encodeList(words) {
    return Buffer.concat(words.map(encode));
}

function decodeList(bytes) {
    let pos = 1;
    const length = bytes.length,
        decodedList = [];

    while (pos < length) {
        const frame = bytes[pos - 1],
            wordLength = frame >> 2,
            ignoresProtocol = frame & 1; //word wasn't encoded using the protocol

        let bytesRequired;
        if (ignoresProtocol) {
            decodedList.push(bytes.slice(pos, pos + wordLength).toString('utf8'));
            bytesRequired = wordLength;
        } else {
            bytesRequired = Math.ceil(wordLength * 5 / 8);
            //for any ECMAScript implementation supporting typed arrays. Node's Buffer is not part of ECMAScript
            const word = new DataView(new Uint8Array(bytes.slice(pos, pos + bytesRequired)).buffer);
            decodedList.push(decode(word, wordLength, frame & 2));
        }
        pos += bytesRequired + 1;
    }

    return decodedList;
}

function buildFrame(word) {
    const firstLetter = word.charCodeAt(0);

    let frame = word.length << 2;
    if (firstLetter > 64 && firstLetter < 91) { //uppercase
        frame |= 1 << 1; //set the 7th bit
    }
    return frame;
}

module.exports = {
    encode: encode,
    decode: decode,
    encodeList: encodeList,
    decodeList: decodeList
};
