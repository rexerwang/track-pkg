#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const util = require('util')
const querystring = require('querystring')
const axios = require('axios')

const pkg = require('./package.json')

const isPretty = any => Array.isArray(any) && any.length

/**
 * 接口
 */
const API = {
  QueryCompany: 'https://www.kuaidi100.com/autonumber/autoComNum?%s',
  Track: 'https://www.kuaidi100.com/query?%s'
}

/**
 * 查询物流
 * @param {String|Numer} no 运单号
 */
async function query(no) {
  const spinner = ora('猜猜是哪家快递公司？').start()

  try {
    let response = await axios.get(
      util.format(
        API.QueryCompany,
        querystring.stringify({
          resultv2: 1,
          text: no
        })
      )
    )

    if (!isPretty(response.data.auto))
      throw new Error('太难了，根本猜不到😭 要不换个号码试试~')

    const comCode = response.data.auto[0].comCode

    spinner.text = `快递公司江湖代号为: ${chalk.underline.yellow(comCode)}`
    spinner.succeed()

    spinner.text = '天地无极包裹追踪'
    spinner.color = 'yellow'
    spinner.start()

    // 查询物流信息
    response = await axios.get(
      util.format(
        API.Track,
        querystring.stringify({
          type: comCode,
          postid: no,
          temp: Math.random()
        })
      )
    )

    if (!response.data || !response.data.data)
      throw new Error('追踪失败，暂无信息 要不再试试~')

    spinner.succeed()
    print(response.data)
  } catch (e) {
    spinner.fail()
    console.log(chalk.red(e.message))
  } finally {
    spinner.stop()
  }
}

/**
 * 打印信息
 * @param {*} data
 */
function print(data) {
  const tracks = data.data
  for (let i = 0; i < tracks.length; i++) {
    const { time, context } = tracks[i]
    let out = chalk.green(time) + ' ' + chalk.yellow(context)
    if (i === 0) out = chalk.bold(out)
    console.log(out)
  }
  console.log(chalk.cyan('\n命令行追踪快递包裹，贼鸡儿6😀'))
}

program
  .version(pkg.version)
  .usage('track-pkg <number> or track-pkg -n <number>')
  .option('-n, --number [type]', 'express number')
  .parse(process.argv)

const number = program.number || process.argv[2]

if (/^\d*$/.test(number)) {
  console.log(chalk.yellow('快递单号: ' + chalk.underline(number)))
  query(number)
} else {
  console.log(
    chalk.red(
      '兄嘚，你得告诉我快递单号，不然巧妇难为无米之炊\n输入`track-pkg -h`可查看帮助'
    )
  )
}
