export function answerEmptyJSON(req, res) {
  // Middlware to answer json. It doesn't matter what we respond with, although of course we must respond with something.
  res.send({});
}
