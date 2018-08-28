/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:28:48
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-28 15:19:33
 */
import {getAppId} from './data/options'

function getPrototype (obj) {
  return Object.prototype.toString.call(obj)
}

export function checkIsFunction (obj) {
  return getPrototype(obj) === '[object Function]'
}

/**
 * 获取页面性能
 *
 * @export
 * @returns
 */
export function getPagePerformance () {
  if (!window.performance) return
  let timing = window.performance.timing
  return {
    // DNS解析时间
    dnst: timing.domainLookupEnd - timing.domainLookupStart || 0,
    // TCP建立时间
    tcpt: timing.connectEnd - timing.connectStart || 0,
    // 白屏时间
    wit: timing.responseStart - timing.navigationStart || 0,
    // dom渲染完成时间
    domt: timing.domContentLoadedEventEnd - timing.navigationStart || 0,
    // 页面onload时间
    lodt: timing.loadEventEnd - timing.navigationStart || 0,
    // 页面准备时间
    radt: timing.fetchStart - timing.navigationStart || 0,
    // 页面重定向时间
    rdit: timing.redirectEnd - timing.redirectStart || 0,
    // unload时间
    uodt: timing.unloadEventEnd - timing.unloadEventStart || 0,
    // request请求耗时
    reqt: timing.responseEnd - timing.requestStart || 0,
    // 页面解析dom耗时
    andt: timing.domComplete - timing.domInteractive || 0
  }
}

/**
 *统计页面资源性能
 *
 * @export
 * @param {*} mapResourceCb
 * @returns
 */
export function getResourcePerformance (mapResourceCb) {
  if (!window.performance && !window.performance.getEntries) return
  let resource = window.performance.getEntriesByType('resource') || []

  return resource.map((item) => {
    const res = {
      name: item.name,
      method: 'GET',
      type: item.initiatorType,
      duration: item.duration.toFixed(2) || 0,
      decodedBodySize: item.decodedBodySize || 0,
      nextHopProtocol: item.nextHopProtocol
    }

    if (checkIsFunction(mapResourceCb)) {
      mapResourceCb(res)
    }

    return res
  })
}

/**
 * @description 提交的表单数据
 * @export
 * @param {*} obj
 * @returns
 */
export function generateCommonReportBody (obj) {
  return Object.assign({
    appId: getAppId(),
    time: new Date().getTime(),
    page: window.location.href, // 当前页面
    preUrl: document.referrer && document.referrer !== window.location.href ? document.referrer : '', // 来自域名
    appVersion: navigator.appVersion, // 浏览器信息
    screenwidth: document.documentElement.clientWidth || document.body.clientWidth,
    screenheight: document.documentElement.clientHeight || document.body.clientHeight
  }, obj)
}

/**
 * 做标记
 *
 * @export
 */
export function markCookies () {
  try {
    const cookieMatch = new RegExp(/`loshi_tj${getAppId()}`/g)

    if (!cookieMatch.test(document.cookie)) {
      document.cookie = `${document.cookie.trim().length ? `${document.cookie};` : ''}loshi_tj${getAppId()}=${new Date().getTime()}`
    }
  } catch (e) {
    console.warn('初始化错误')
  }
}
