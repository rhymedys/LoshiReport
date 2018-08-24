/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:28:48
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 17:05:25
 */

function getPrototype (obj) {
  return Object.prototype.toString.call(obj)
}

export function checkIsFunction (obj) {
  return getPrototype(obj) === '[object Function]'
}

export function checkIsObject (obj) {
  return getPrototype(obj) === '[object Object]'
}

/**
 *
 * @export 获取AppId
 * @param {*} options 如果options中有，则提取options中的，否则从脚本src获取
 * @returns
 */
export function getAppId (options) {
  let appId = null
  if (options && options.appId) {
    appId = options.appId
    delete options.appId
  } else {
    const scriptList = Array.from(document.getElementsByTagName('script'))
    const reg = new RegExp(/loshi-report.*?js/)
    const res = scriptList.find(val => reg.test(val.getAttribute('src')))
    res && (appId = res.getAttribute('src').split('?')[1])
  }

  return appId
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
