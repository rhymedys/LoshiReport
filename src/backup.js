/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-15 16:23:33
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-26 14:30:21
 */
let errorList = []
let addData = {}
let appId = null
let opt = {
  // 上报地址
  reportApi: 'http://localhost/api',
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

let conf = {
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

// error default
let errordefo = {
  t: '', // 时间戳
  n: 'js', // 报错类型
  msg: '', // 信息
  data: {} // 其他信息
}

let beginTime = new Date().getTime() // 初始化时间
let loadTime = 0
let ajaxTime = 0
let fetchTime = 0
let callBack = null
let hadReportInit = false

function checkIsFunction (obj) {
  return Object.prototype.toString.call(obj) === '[object Function]'
}

// 统计页面性能
function performancePage () {
  if (!window.performance) return
  let timing = window.performance.timing
  conf.performance = {
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

// 统计页面资源性能
function performanceResource () {
  if (!window.performance && !window.performance.getEntries) return false
  let resource = window.performance.getEntriesByType('resource')

  let resourceList = []
  if (!resource && !resource.length) return resourceList

  resource.forEach((item) => {
    let json = {
      name: item.name,
      method: 'GET',
      type: item.initiatorType,
      duration: item.duration.toFixed(2) || 0,
      decodedBodySize: item.decodedBodySize || 0,
      nextHopProtocol: item.nextHopProtocol
    }
    if (conf.ajaxMsg && conf.ajaxMsg.length) {
      for (let i = 0, len = conf.ajaxMsg.length; i < len; i++) {
        if (conf.ajaxMsg[i].url === item.name) {
          json.method = conf.ajaxMsg[i].method || 'GET'
          json.type = conf.ajaxMsg[i].type || json.type
        }
      }
    }
    resourceList.push(json)
  })
  conf.resourceList = resourceList
}

// 比较onload与ajax时间长度
function getLargeTime () {
  if (conf.haveAjax && conf.haveFetch && loadTime && ajaxTime && fetchTime) {
    console.log(`loadTime:${loadTime},ajaxTime:${ajaxTime},fetchTime:${fetchTime}`)
    reportData()
  } else if (conf.haveAjax && !conf.haveFetch && loadTime && ajaxTime) {
    console.log(`loadTime:${loadTime},ajaxTime:${ajaxTime}`)
    reportData()
  } else if (!conf.haveAjax && conf.haveFetch && loadTime && fetchTime) {
    console.log(`loadTime:${loadTime},fetchTime:${fetchTime}`)
    reportData()
  } else if (!conf.haveAjax && !conf.haveFetch && loadTime) {
    console.log(`loadTime:${loadTime}`)
    reportData()
  }
}

// ajax重写
function injectListener2Ajax (funs) {
  window._ahrealxhr = window._ahrealxhr || window.XMLHttpRequest
  window.XMLHttpRequest = function () {
    this.xhr = new window._ahrealxhr()
    for (let attr in this.xhr) {
      let type = ''
      try {
        type = typeof this.xhr[attr]
      } catch (e) {}
      if (type === 'function') {
        this[attr] = hookfun(attr)
      } else {
        Object.defineProperty(this, attr, {
          get: getFactory(attr),
          set: setFactory(attr)
        })
      }
    }
  }
  function getFactory (attr) {
    return function () {
      return this.hasOwnProperty(attr + '_') ? this[attr + '_'] : this.xhr[attr]
    }
  }
  function setFactory (attr) {
    return function (f) {
      let xhr = this.xhr
      let that = this
      if (attr.indexOf('on') != 0) {
        this[attr + '_'] = f
        return
      }
      if (funs[attr]) {
        xhr[attr] = function () {
          funs[attr](that) || f.apply(xhr, arguments)
        }
      } else {
        xhr[attr] = f
      }
    }
  }
  function hookfun (fun) {
    return function () {
      let args = [].slice.call(arguments)
      if (funs[fun] && funs[fun].call(this, args, this.xhr)) {
        return
      }
      return this.xhr[fun].apply(this.xhr, args)
    }
  }
  return window._ahrealxhr
}

function reportData () {
  setTimeout(() => {
    if (opt.isPage) performancePage()
    if (opt.isResource) performanceResource()
    if (errorList && errorList.length) conf.errorList = conf.errorList.concat(errorList)
    let w = document.documentElement.clientWidth || document.body.clientWidth
    let h = document.documentElement.clientHeight || document.body.clientHeight
    let result = {
      time: new Date().getTime(),
      page: conf.page,
      preUrl: conf.preUrl,
      appVersion: conf.appVersion,
      errorList: conf.errorList,
      performance: conf.performance,
      resourceList: conf.resourceList,
      addData,
      appId,
      screenwidth: w,
      screenheight: h
    }
    // console.log(JSON.stringify(result))
    checkIsFunction(callBack) && callBack(result)
    if (!callBack && window.fetch) {
      window.fetch(opt.reportApi, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        type: 'report-data',
        body: JSON.stringify(result)
      }).then(() => {
        console.log('finish fetch', conf)
      })
    }
  }, opt.outtime)
}

function getAjaxTime (type) {
  conf.loadNum += 1
  if (conf.loadNum === conf.ajaxLength) {
    if (type === 'load') {
      console.log('走了AJAX onload 方法')
    } else if (type === 'readychange') {
      console.log('走了AJAX onreadystatechange 方法')
    } else {
      console.log('走了 error 方法')
    }
    conf.ajaxLength = conf.loadNum = 0
    ajaxTime = new Date().getTime() - beginTime
    getLargeTime()
  }
}

// ajax统一上报入口
function ajaxResponse (xhr, type) {
  let defaults = Object.assign({}, errordefo)
  defaults.t = new Date().getTime()
  defaults.n = 'ajax'
  defaults.msg = xhr.statusText || 'ajax request error'
  defaults.method = xhr.method
  defaults.data = {
    resourceUrl: xhr.responseURL,
    text: xhr.statusText,
    status: xhr.status,
    payload: xhr.xhr.body
  }

  conf.errorList.push(defaults)
}

function clearPerformance (type) {
  if (!window.performance && !window.performance.clearResourceTimings) return
  if (conf.haveAjax && conf.haveFetch && conf.ajaxLength === 0 && conf.fetLength === 0) {
    clear()
  } else if (!conf.haveAjax && conf.haveFetch && conf.fetLength === 0) {
    clear()
  } else if (conf.haveAjax && !conf.haveFetch && conf.ajaxLength === 0) {
    clear()
  }
}

function clear () {
  window.performance.clearResourceTimings()
  conf.performance = {}
  conf.errorList = []
  conf.preUrl = ''
  conf.resourceList = ''
  conf.page = window.location.href
  errorList = []
  addData = []
}

// 拦截js error信息
function initErrorInterceptor () {
  // img,script,css,jsonp
  window.addEventListener('error', function (e) {
    console.log('window error listener', e)
    let defaults = Object.assign({}, errordefo)
    defaults.n = 'resource'
    defaults.t = new Date().getTime()
    defaults.msg = e.target.localName + ' is load error'
    defaults.method = 'GET'
    defaults.data = {
      target: e.target.localName,
      type: e.type,
      resourceUrl: e.target.currentSrc
    }
    if (e.target !== window) conf.errorList.push(defaults)
  }, true)
  // js
  window.onerror = function (msg, resourceUrl, line, col, error) {
    console.log('window onerror', msg, resourceUrl, line, col, error)
    let defaults = Object.assign({}, errordefo)
    setTimeout(() => {
      col = col || (window.event && window.event.errorCharacter) || 0
      defaults.msg = error && error.stack ? error.stack.toString() : msg
      defaults.method = 'GET'
      defaults.t = new Date().getTime()
      defaults.data = {
        resourceUrl,
        line,
        col
      }
      conf.errorList.push(defaults)
    }, 0)
  }
}

function initAjaxInterceptor () {
  injectListener2Ajax({
    onreadystatechange (xhr) {
      if (xhr.readyState === 4) {
        setTimeout(() => {
          if (conf.goingType === 'load') return
          conf.goingType = 'readychange'

          getAjaxTime('readychange')

          if (xhr.status < 200 || xhr.status > 300) {
            xhr.method = xhr.args.method
            ajaxResponse(xhr)
          }
        }, 600)
      }
    },
    onerror (xhr) {
      getAjaxTime('error')
      if (xhr.args) {
        xhr.method = xhr.args.method
        xhr.responseURL = xhr.args.url
        xhr.statusText = 'ajax request error'
      }
      ajaxResponse(xhr)
    },
    onload (xhr) {
      if (xhr.readyState === 4) {
        if (conf.goingType === 'readychange') return
        conf.goingType = 'load'
        getAjaxTime('load')
        if (xhr.status < 200 || xhr.status > 300) {
          xhr.method = xhr.args.method
          ajaxResponse(xhr)
        }
      }
    },
    send (data, xhr) {
      let res = {}
      if (data && data.length && data[0]) {
        data[0].split('&').forEach(val => {
          const valKV = val.split('=')
          res[valKV[0]] = valKV[1] || ''
        })
      }

      xhr.body = res
    },
    open (arg, xhr) {
      if (opt.filterUrl && opt.filterUrl.length) {
        let begin = false
        opt.filterUrl.forEach(item => { if (arg[1].indexOf(item) !== -1) begin = true })
        if (begin) return
      }

      let result = { url: arg[1], method: arg[0] || 'GET', type: 'xmlhttprequest' }
      this.args = result

      clearPerformance()
      conf.ajaxMsg.push(result)
      conf.ajaxLength = conf.ajaxLength + 1
      conf.haveAjax = true
    }
  })
}

/**
 *b绑定Load事件
 *
 */
function attachLoadEventListener () {
  window.addEventListener('load', function () {
    loadTime = new Date().getTime() - beginTime
    getLargeTime()
  }, false)
}

/**
 * 从脚本连接中获取appId
 *
 */
function initAppId (options) {
  if (options && options.appId) {
    appId = options.appId
    delete options.appId
  } else {
    const scriptList = Array.from(document.getElementsByTagName('script'))
    const reg = new RegExp(/loshi-report.*?js/)
    const res = scriptList.find(val => reg.test(val.getAttribute('src')))
    res && (appId = res.getAttribute('src').split('?')[1])
  }
}

class Report {
  /**
   * 初始化
   *
   * @param {*} options
   * @param {*} cb
   * @returns
   * @memberof Report
   */
  init (options, cb) {
    Object.defineProperty(window, 'LoshiReport', {
      value: this,
      configurable: false,
      writable: false
    })
    Object.freeze(window.LoshiReport)
    /* eslint no-proto: "error" */
    Object.freeze(window.LoshiReport.__proto__)

    initAppId(options)

    opt = Object.assign(opt, options)
    callBack = cb

    if (opt.isError) initErrorInterceptor()

    attachLoadEventListener()

    if (opt.isResource || opt.isError) initAjaxInterceptor()

    return this
  }

  addError (err) {
    if (err) {
      let errObj = {
        method: 'GET',
        msg: err.msg,
        n: 'js',
        data: {
          col: err.col,
          line: err.line,
          resourceUrl: err.resourceUrl
        }
      }
      errorList.push(errObj)
    }

    return this
  }

  addData (cb) {
    checkIsFunction(cb) && cb(addData)

    return this
  }
}

export default new Report()
