/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-08-23 15:15:14
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-08-27 09:31:59
 */

export default function () {
  return {
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
    // 初始化汇报
    hadInitReport: false,
    // 正在上传初始化报告
    reportingInitData: false
  }
}
