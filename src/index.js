/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-15 16:23:33
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-21 14:31:17
 */
let errorList = []
let addData = {}
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

function checkIsFunction (obj) {
  return Object.prototype.toString.call(obj) === '[object Function]'
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
    // if (opt.isPage) perforPage()
    // if (opt.isResource) perforResource()
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
    status: xhr.status
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

class Report {
  init (options, cb) {
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
    if (checkIsFunction(cb) && cb) {
      return cb(addData)
    }
  }
}

export default new Report()
