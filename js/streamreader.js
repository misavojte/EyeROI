function streamBlob(blob) { let utf8decoder = new TextDecoder(); console.time("a");
  const reader = new Response(blob).body.getReader()
  const pump = reader => reader.read()
  .then(({ value, done }) => {
    if (done) {console.timeEnd("a");return}
    // uint8array chunk (use TextDecoder to read as text)
    testar += utf8decoder.decode(value)
    return pump(reader)
  })
  return pump(reader)
}

//input - file.stream()
//source: https://developer.mozilla.org/en-US/docs/Web/API/Response/body
