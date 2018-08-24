/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:28:29
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-24 10:52:49
 */
import times from './data/time'
import state from './data/state'
import {checkIsFunction, getAppId} from './utils'
import {setOptions, getOption} from './data/options'
import initErrorInterceptor from './interceptor/error'
import initLoadEventInterceptor from './interceptor/loadEvent'
import initAjaxInterceptor from './interceptor/ajax'

let appId = null // 应1用Id

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

          // getAjaxTime('readychange')

          if (xhr.status < 200 || xhr.status > 300) {
            xhr.method = xhr.args.method
            // ajaxResponse(xhr)
          }
        }, 600)
      }
    },
    onerror (xhr) {
      console.log('onerror', xhr.readyState)

      // getAjaxTime('error')
      if (xhr.args) {
        xhr.method = xhr.args.method
        xhr.responseURL = xhr.args.url
        xhr.statusText = 'ajax request error'
      }
      // ajaxResponse(xhr)
    },
    onload (xhr) {
      console.log('onload', xhr.readyState)

      if (xhr.readyState === 4) {
        if (state.goingType === 'readychange') return
        state.goingType = 'load'
        // getAjaxTime('load')
        if (xhr.status < 200 || xhr.status > 300) {
          xhr.method = xhr.args.method
          // ajaxResponse(xhr)
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

      // clearPerformance()
      // conf.ajaxMsg.push(result)
      // conf.ajaxLength = conf.ajaxLength + 1
      // conf.haveAjax = true
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

    appId = getAppId(options)

    setOptions(options)

    initLoadEventInterceptor(true, initLoadEventInterceptorCb)

    initErrorInterceptor(getOption().isError, initErrorInterceptorCb)

    initAjaxInterceptor(getOption().isError, getInitAjaxInterceptorConfig())
    // if (opt.isResource || opt.isError) initAjaxInterceptor()

    // return this
  }

  //   addError (err) {
  //     if (err) {
  //       let errObj = {
  //         method: 'GET',
  //         msg: err.msg,
  //         n: 'js',
  //         data: {
  //           col: err.col,
  //           line: err.line,
  //           resourceUrl: err.resourceUrl
  //         }
  //       }
  //       errorList.push(errObj)
  //     }

  //     return this
  //   }

  //   addData (cb) {
  //     checkIsFunction(cb) && cb(addData)

//     return this
//   }
}

export default new Report()
