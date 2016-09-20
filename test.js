var wordEncoder = require('./word-encoder'),
    http = require('http'),
    assert = require('assert');


http.get('http://users.cs.duke.edu/~ola/ap/linuxwords', function (res) {
    var words;
    res.setEncoding('utf8');
    res.on('data', data => words += data)
        .on('end', () => test(words));
});


function test(words) {
    const wordsList = words.split('\n'),
        encodedWords = wordEncoder.encodeList(wordsList);

    wordEncoder.decodeList(encodedWords).forEach((word, index) => {
        assert.equal(wordsList[index], word);
    });

    console.log('Byte count before encoding', Buffer.byteLength(words, 'utf8'));
    console.log('Byte count after encoding', encodedWords.length);
}