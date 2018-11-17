#!/usr/bin/env node

const yargs = require('yargs')
  .usage('font2icons [path] -o [output] -c -v')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    describe: '打印日志信息',
    default: false,
  })
  .option('path', {
    alias: 'p',
    describe: '字体文件的路径',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    describe: '输出路径',
    type: 'string',
    default: 'images',
  })
  .option('clear', {
    alias: 'c',
    describe: '是否在输出前清除输出目录',
    type: 'boolean',
    default: false,
  })

const argv = yargs.argv
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const fontCarrier = require('font-carrier')

const printInfo = (msg, always) => {
  if (argv.verbose || always) {
    console.log(`${chalk.white(msg)}\n`)
  }
}

const printError = (msg) => {
  console.error(chalk.red(msg))
}

const getFilePath = (filePath, createDir) => {
  const file = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath)
  let error = ''
  if (!fs.existsSync(file)) {
    if (createDir) {
      fs.mkdirSync(file)
    } else {
      error = `不存在的文件路径：${file}`
    }
  } else if (createDir) {
    if (!fs.statSync(file).isDirectory()) {
      error = `路径非目录：${file}`
    } else if (argv.clear) {
      require('rimraf').sync(file, {
        disableGlob: true,
      })
      fs.mkdirSync(file)
    }
  }
  if (error) {
    printError(error)
  }
  return error ? '' : file
}

const exec = (setup) => {
  const { path: filePath, output } = setup
  if (!filePath) {
    printError('必须指定待处理字体文件的路径')
  } else {
    const inputPath = getFilePath(filePath)
    const outputPath = inputPath ? getFilePath(output, true) : ''
    if (inputPath && outputPath) {
      printInfo(`待转换的文件：${inputPath}`)
      printInfo(`输出路径：${outputPath}`)
      try {
        const font = fontCarrier.transfer(inputPath)
        const glyphs = font.allGlyph()
        Object.keys(glyphs).forEach((code) => {
          const glyph = glyphs[code]
          fs.writeFileSync(
            `${outputPath}/${code}.svg`,
            glyph.toSvg(),
            (error) => printError(error)
          )
        })
        printInfo('done!', true)
      } catch (e) {
        printError(e)
      }
    }
  }
}

if (!argv._.length) {
  yargs.showHelp('log')
} else {
  exec({
    path: argv.path || argv._[0],
    output: argv.output,
  })
}
