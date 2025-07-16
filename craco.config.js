module.exports = {
  babel: {
    plugins: [
      [
        'import',
        {
          libraryName: 'antd',
          libraryDirectory: 'es',
          style: false // отключить автоматический импорт стилей antd
        },
        'antd'
      ]
    ]
  }
}; 