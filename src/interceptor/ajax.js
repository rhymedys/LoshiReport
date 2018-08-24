/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 17:12:27
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 18:30:03
 */

export default function injectListener2Ajax (inject, funs) {
  if (!inject || !funs) return

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
