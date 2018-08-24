/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 16:36:11
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-23 16:38:55
 */

import {checkIsFunction} from '../utils'

export default function (listen, cb) {
  if (!checkIsFunction(cb) || !listen) return
  window.addEventListener('load', cb, false)
}
