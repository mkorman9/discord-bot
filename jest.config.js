const config = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: [
    'src'
  ]
};

module.exports = config;
