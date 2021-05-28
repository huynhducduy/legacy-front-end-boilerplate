module.exports = {
  presets: [
    [
      require.resolve('babel-preset-duy'),
      {
        outside: false,
        react: false,
        wdyr: false,
        typescript: false,
        datefns: false,
        ramda: false,
      },
    ],
  ],
}
