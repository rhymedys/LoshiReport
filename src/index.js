/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:28:29
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-28 14:50:35
 */
import times from './data/time'
import getOrgState from './data/state'
import {getPagePerformance, getResourcePerformance, generateCommonReportBody, markCookies} from './utils'
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
    if (initReport) state.reportingInitData = true
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
      if (initReport) {
        state.hadInitReport = true
        state.reportingInitData = false
      }
      console.log('fetch finally state', state)
    })
  }
}

/**
 * 是否正在上传初始化报告或者已经上传完初始化报告
 *
 * @param {*} resolveCb 是___回调
 * @param {*} rejectCb  否___回调
 */
function checkHadInitReportOrReportingInitData (resolveCb, rejectCb) {
  if (state.reportingInitData || state.hadInitReport) {
    resolveCb && resolveCb()
  } else {
    rejectCb && rejectCb()
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
  checkHadInitReportOrReportingInitData(() => {
    reportData(generateCommonReportBody({
      errorList: [errObj]
    }))
  }, () => {
    state.errorList.push(errObj)
  })
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
  function reportErrorOrPush2ErrorList (xhr) {
    checkHadInitReportOrReportingInitData(() => {
      reportData(generateCommonReportBody({
        errorList: [getAjaxFeedbackObj(xhr)]
      }))
    }, () => {
      state.errorList.push(getAjaxFeedbackObj(xhr))
    })
  }

  return {
    onreadystatechange (xhr) {
      console.log('onreadystatechangeCb', xhr.readyState)
      // 完成状态
      if (xhr.readyState === 4) {
        setTimeout(() => {
          if (state.goingType === 'load') return
          state.goingType = 'readychange'
          checkHadInitReportOrReportingInitData(null, () => {
            getAjaxTime('readychange')
          })

          if (xhr.status < 200 || xhr.status > 300) {
            xhr.method = xhr.args.method
            reportErrorOrPush2ErrorList(xhr)
          }
        }, 600)
      }
    },
    onerror (xhr) {
      console.log('onerrorCb', xhr.readyState)
      checkHadInitReportOrReportingInitData(null, () => {
        getAjaxTime('error')
      })
      if (xhr.args) {
        xhr.method = xhr.args.method
        xhr.responseURL = xhr.args.url
        xhr.statusText = 'ajax request error'
      }
      reportErrorOrPush2ErrorList(xhr)
    },
    onload (xhr) {
      console.log('onloadCb', xhr.readyState)

      if (xhr.readyState === 4) {
        if (state.goingType === 'readychange') return
        state.goingType = 'load'
        checkHadInitReportOrReportingInitData(null, () => {
          getAjaxTime('load')
        })
        if (xhr.status < 200 || xhr.status > 300) {
          xhr.method = xhr.args.method
          reportErrorOrPush2ErrorList(xhr)
        }
      }
    },
    send (data, xhr) {
      console.log('sendCb')
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
      console.log('openCb')

      const filterUrl = getOption().filterUrl
      if (filterUrl && filterUrl.length) {
        let begin = false
        filterUrl.forEach(item => { if (arg[1].indexOf(item) !== -1) begin = true })
        if (begin) return
      }

      let result = { url: arg[1], method: arg[0] || 'GET', type: 'xmlhttprequest' }
      this.args = result
      checkHadInitReportOrReportingInitData(null, () => {
        state.ajaxMsg.push(result)
        state.ajaxLength = state.ajaxLength + 1
        state.haveAjax = true
      })
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

    markCookies()

    initLoadEventInterceptor(true, initLoadEventInterceptorCb)

    initErrorInterceptor(getOption().isError, initErrorInterceptorCb)

    initAjaxInterceptor(getOption().isError, getInitAjaxInterceptorConfig())
  }
}

export default new Report()
