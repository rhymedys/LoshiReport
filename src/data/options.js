/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:45:41
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 14:50:03
 */

let opt = {
  // 上报地址
  reportApi: 'http://localhost:7001/api',
  // 脚本延迟上报时间
  outtime: 1000,
  // ajax请求时需要过滤的url信息
  filterUrl: ['http://localhost:35729/livereload.js?snipver=1', 'http://localhost:8000/sockjs-node/info'],
  // 是否上报页面性能数据
  isPage: true,
  // 是否上报页面资源数据
  isResource: true,
  // 是否上报错误信息
  isError: true
}

/**
 * 设置options
 *
 * @export
 * @param {*} obj
 * @returns
 */
export function setOptions (obj) {
  obj && Object.assign(opt, obj)
  return opt
}

/**
 *获取option
 *
 * @export
 * @param {*} key
 * @returns
 */
export function getOption (key) {
  let res = opt
  key && (res = opt[key])
  return res
}
