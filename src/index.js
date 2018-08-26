/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:28:29
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-26 17:11:50
 */
import times from './data/time'
import getOrgState from './data/state'
import {getPagePerformance, getResourcePerformance, generateCommonReportBody} from './utils'
import {setOptions, getOption, setAppId} from './data/options'
import initErrorInterceptor from './interceptor/error'
import initLoadEventInterceptor from './interceptor/loadEvent'
import initAjaxInterceptor, {getAjaxFeedbackObj} from './interceptor/ajax'

let state = Object.assign({}, getOrgState())

function resetState2Def () {
  state = Object.assign({}, getOrgState(), {
    hadInitReport: state.hadInitReport
  })
}

// 比较onload与ajax时间长度
function getLargeTime () {
  const {loadTime, ajaxTime, fetchTime} = times
  if (state.haveAjax && state.haveFetch && loadTime && ajaxTime && fetchTime) {
    console.log(`loadTime:${loadTime},ajaxTime:${ajaxTime},fetchTime:${fetchTime}`)
  } else if (state.haveAjax && !state.haveFetch && loadTime && ajaxTime) {
    console.log(`loadTime:${loadTime},ajaxTime:${ajaxTime}`)
  } else if (!state.haveAjax && state.haveFetch && loadTime && fetchTime) {
    console.log(`loadTime:${loadTime},fetchTime:${fetchTime}`)
  } else if (!state.haveAjax && !state.haveFetch && loadTime) {
    console.log(`loadTime:${loadTime}`)
  }
}

/**
 * @description 发送报告
 * @param {*} reportObj
 * @param {*} initReport
 */
function reportData (reportObj, initReport) {
  if (window.fetch && reportObj) {
    console.log('reportObj', reportObj)
    window.fetch(getOption().reportApi, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      type: 'report-data',
      body: JSON.stringify(reportObj)
    }).then(() => {
      console.log('fetch then', state)
    }).finally(() => {
      initReport && (state.hadInitReport = true)
      console.log('fetch finally state', state)
    })
  }
}

function getAjaxTime (type) {
  state.loadNum += 1
  if (state.loadNum === state.ajaxLength) {
    if (type === 'load') {
      console.log('走了AJAX onload 方法')
    } else if (type === 'readychange') {
      console.log('走了AJAX onreadystatechange 方法')
    } else {
      console.log('走了 error 方法')
    }
    state.ajaxLength = state.loadNum = 0
    times.ajaxTime = new Date().getTime() - times.beginTime
    getLargeTime()
  }
}

function mapResourcePerformanceCb (item) {
  if (state.ajaxMsg && state.ajaxMsg.length) {
    for (let i = 0, len = state.ajaxMsg.length; i < len; i++) {
      if (state.ajaxMsg[i].url === item.name) {
        item.method = state.ajaxMsg[i].method || 'GET'
        item.type = state.ajaxMsg[i].type || item.type
      }
    }
  }
}

/**
 *  错误拦截回调
 *
 * @param {*} errObj
 */
function initErrorInterceptorCb (errObj) {
  state.errorList.push(errObj)
}

/**
 * 加载拦截回调
 *
 */
function initLoadEventInterceptorCb () {
  times.loadTime = new Date().getTime() - times.beginTime
  getLargeTime()
  const copyState = Object.assign({}, state)

  setTimeout(() => {
    resetState2Def()
    const reportBody = generateCommonReportBody({
      errorList: copyState.errorList,
      performance: getOption('isPage') ? getPagePerformance() : null,
      resourceList: getOption('isResource') ? getResourcePerformance(mapResourcePerformanceCb) : null
    })
    reportData(reportBody, true)
  }, getOption('outtime'))
  console.log('loadEvent', times)
}

function getInitAjaxInterceptorConfig () {
  return {
    onreadystatechange (xhr) {
      console.log('onreadystatechange', xhr.readyState)
      // 完成状态
      if (xhr.readyState === 4) {
        setTimeout(() => {
          if (state.goingType === 'load') return
          state.goingType = 'readychange'

          getAjaxTime('readychange')

          if (xhr.status < 200 || xhr.status > 300) {
            xhr.method = xhr.args.method
            if (!state.hadInitReport) {
              state.errorList.push(getAjaxFeedbackObj(xhr))
            }
          }
        }, 600)
      }
    },
    onerror (xhr) {
      console.log('onerror', xhr.readyState)

      getAjaxTime('error')
      if (xhr.args) {
        xhr.method = xhr.args.method
        xhr.responseURL = xhr.args.url
        xhr.statusText = 'ajax request error'
      }
      if (!state.hadInitReport) {
        state.errorList.push(getAjaxFeedbackObj(xhr))
      }
    },
    onload (xhr) {
      console.log('onload', xhr.readyState)

      if (xhr.readyState === 4) {
        if (state.goingType === 'readychange') return
        state.goingType = 'load'
        getAjaxTime('load')
        if (xhr.status < 200 || xhr.status > 300) {
          xhr.method = xhr.args.method
          if (!state.hadInitReport) {
            state.errorList.push(getAjaxFeedbackObj(xhr))
          }
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
      const filterUrl = getOption().filterUrl
      if (filterUrl && filterUrl.length) {
        let begin = false
        filterUrl.forEach(item => { if (arg[1].indexOf(item) !== -1) begin = true })
        if (begin) return
      }

      let result = { url: arg[1], method: arg[0] || 'GET', type: 'xmlhttprequest' }
      this.args = result

      if (!state.hadInitReport) {
        state.ajaxMsg.push(result)
        state.ajaxLength = state.ajaxLength + 1
        state.haveAjax = true
      }
    }
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

    setAppId(options)

    setOptions(options)

    initLoadEventInterceptor(true, initLoadEventInterceptorCb)

    initErrorInterceptor(getOption().isError, initErrorInterceptorCb)

    initAjaxInterceptor(getOption().isError, getInitAjaxInterceptorConfig())
  }
}

export default new Report()
