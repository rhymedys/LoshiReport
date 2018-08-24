/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 15:15:14
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 18:30:07
 */
let orgState = {
  // 资源列表
  resourceList: [],
  // 页面性能列表
  performance: {},
  // 错误列表
  errorList: [],
  // 页面fetch数量
  fetchNum: 0,
  // ajax onload数量
  loadNum: 0,
  // 页面ajax数量
  ajaxLength: 0,
  // 页面fetch总数量
  fetLength: 0,
  // 页面ajax信息
  ajaxMsg: [],
  // ajax成功执行函数
  goingType: '',
  // 是否有ajax
  haveAjax: false,
  // 是否有fetch
  haveFetch: false,
  // 来自域名
  preUrl: document.referrer && document.referrer !== window.location.href ? document.referrer : '',
  // 浏览器信息
  appVersion: navigator.appVersion,
  // 当前页面
  page: window.location.href
}

export default orgState
