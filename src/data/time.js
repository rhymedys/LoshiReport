/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 16:51:13
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 16:53:04
 */

let beginTime = new Date().getTime() // 初始化时间

let times = {
  beginTime,
  loadTime: 0,
  ajaxTime: 0,
  fetchTime: 0
}

Object.defineProperty(times, 'beginTime', {
  value: beginTime,
  writable: false,
  configurable: false
})

export default times
