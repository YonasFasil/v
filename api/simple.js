// Ultra simple function with no dependencies
module.exports = (req, res) => {
  res.json({ status: 'working', time: Date.now() });
};