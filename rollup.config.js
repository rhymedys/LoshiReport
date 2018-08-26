/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-15 16:08:14
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-26 16:02:00
 */

'use strict'

import babel from 'rollup-plugin-babel' // ES6转ES5插件;
import commonjs from 'rollup-plugin-commonjs' // 将CommonJS模块转换成ES6，防止他们在Rollup中失效;
import uglify from 'rollup-plugin-uglify' // js压缩;
import packageInfo from './package.json'

export default {
  entry: 'src/index.js', // 入口文件;            // 打包输入格式分别为:amd,cjs,es,iife,umd;(https://github.com/rollup/rollup/wiki/JavaScript-API#format);
  output: {
    file: `dist/loshi-report.${packageInfo.version}.js`,
    format: 'umd'
  },
  name: 'LoshiReport',
  plugins: [
    commonjs(), // 将CommonJS模块转换成ES6;
    babel({
      exclude: 'node_modules/**' // 排除node_modules文件夹
    }),
    uglify()// js压缩;
  ]
}
