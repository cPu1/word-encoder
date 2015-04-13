var wordEncoder = require('./word-encoder'),
    http = require('http'),
    assert = require('assert');


http.get('http://www.cs.duke.edu/~ola/ap/linuxwords', function (res) {
    var words;
    res.setEncoding('utf8');
    res.on('data', function (data) {
        words += data;
    }).on('end', function () {
        test(words);
    });
});


function test (words) {
    var wordsList = words.split('\n'),
        encodedWords = wordEncoder.encodeList(wordsList);

    wordEncoder.decodeList(encodedWords).forEach(function (word, index) {
        assert.equal(wordsList[index], word);
    });

    console.log('Byte count before encoding', Buffer.byteLength(words, 'utf8'));
    console.log('Byte count after encoding', encodedWords.length);
}