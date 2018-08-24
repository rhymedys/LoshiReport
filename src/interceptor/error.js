/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 14:56:19
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 17:20:01
 */

import defErrObj from '../constant/defErrObj'
import {checkIsFunction} from '../utils'

/**
 * 生成错误对象格式
 *
 * @param {*} obj
 * @returns
 */
function generateErrRes (obj) {
  return Object.assign(
    {},
    defErrObj,
    {
      t: new Date().getTime(),
      method: 'GET'
    },
    obj
  )
}

/**
 * 初始化错误监听
 *
 * @export
 * @param {*} cb
 */
export default function (listen, cb) {
  if (!checkIsFunction(cb) || !listen) return
  // img,script,css,jsonp
  window.addEventListener('error', function (e) {
    if (e.target !== window) {
      console.log('window error listener', e)
      const res = generateErrRes({
        n: 'resource',
        msg: `${e.target.localName} is load error`,
        data: {
          target: e.target.localName,
          type: e.type,
          resourceUrl: e.target.currentSrc
        }
      })

      cb(res)
    }
  }, true)
  // js
  window.onerror = function (msg, resourceUrl, line, col, error) {
    console.log('window onerror', msg, resourceUrl, line, col, error)
    const res = generateErrRes({
      col: col || (window.event && window.event.errorCharacter) || 0,
      msg: error && error.stack ? error.stack.toString() : msg,
      data: {
        resourceUrl,
        line,
        col
      }
    })
    setTimeout(() => cb(res), 0)
  }
}
