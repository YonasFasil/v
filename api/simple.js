// Ultra simple function with no dependencies
export default (req, res) => {
  res.json({ status: 'working', time: Date.now() });
};