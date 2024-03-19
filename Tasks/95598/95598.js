/******************************************
 * @name 网上国网🌏
 * @channel https://t.me/yqc_123/
 * @feedback https://t.me/yqc_777/
 * @author 𝒀𝒖𝒉𝒆𝒏𝒈
 * @update 20240319
 * @version 1.1.0
 *****************************************
脚本声明:
1. 本脚本仅用于学习研究，禁止用于商业用途
2. 本脚本不保证准确性、可靠性、完整性和及时性
3. 任何个人或组织均可无需经过通知而自由使用
4. 作者对任何脚本问题概不负责，包括由此产生的任何损失
5. 如果任何单位或个人认为该脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明、所有权证明，我将在收到认证文件确认后删除
6. 请勿将本脚本用于商业用途，由此引起的问题与作者无关
7. 本脚本及其更新版权归作者所有
 ******************************************/
const $ = new Env('网上国网') // 建议一天查询一次即可, 无需频繁查询
// ------------------------------------------------------
// 数据定义区
const notify = $.isNode() ? require('./sendNotify') : ''
const BASE_URL = 'https://www.95598.cn' // 国网域名
const MY_SERVER = 'https://free.yuhengy17.me' // 感谢tg群友@woxihuanniya提供的服务器
// const MY_SERVER= ''  // 本地测试
// ------------------------------------------------------
// 处理boxjs存入的'true'|'false'
$.isTrue = (val) => val === 'true' || val === true
// 副标题
$.subTitle = []
// 通知列表
$.message = []
// KEYCODE/PUBLICKEY
$.requestCyu
// 用户数据缓存
$.requestBizrt = $.toObj($.getdata('95598_bizrt'))
// 用户凭证码
$.authorizeCode
// 用户凭证
$.requestToke
// 用户绑定缓存
$.bindInfo = $.toObj($.getdata('95598_bindInfo'))
// ------------------------------------------------------
// 缓存定义区
// 是否打印日志 => 默认关闭
const LOG_DEBUG = $.isTrue($.isNode() ? process.env.WSGW_LOG_DEBUG : $.getdata('95598_log_debug'))
// 国网登录账号
const USERNAME = ($.isNode() ? process.env.WSGW_USERNAME : $.getdata('95598_username')) || ''
// 国网登录密码
const PASSWORD = ($.isNode() ? process.env.WSGW_PASSWORD : $.getdata('95598_password')) || ''
// 是否显示近期用电量
const SHOW_RECENT = $.isTrue($.isNode() ? process.env.WSGW_RECENT_ELC_FEE : $.getdata('95598_recent_elc_fee'))
// 通知类型: 仅通知默认用户 | 通知所有用户 => 默认会显示所有用户信息
const NOTIFY_ALL = $.isTrue($.isNode() ? process.env.WSGW_NOTIFY_ALL : $.getdata('95598_notify_type'))
// ------------------------------------------------------
!(async () => {
    await showNotice()
    if (!USERNAME || !PASSWORD)
        return $.msg('网上国网', '请先配置网上国网账号密码!', '点击前往BoxJs配置', {
            'open-url': 'http://boxjs.com/#/sub/add/https%3A%2F%2Fraw.githubusercontent.com%2FYuheng0101%2FX%2Fmain%2FTasks%2Fboxjs.json'
        })
    const wsgw = new WSGW()
    await wsgw.getCode()
    if ($.requestBizrt) {
        const { token, userInfo } = $.requestBizrt
        $.log(`🔑 用户凭证: ${token}`)
        $.log(`👤 用户信息: ${$.toStr(userInfo[0].loginAccount)}`)
    } else {
        await wsgw.refreshToken()
    }
    await wsgw.refreshAccessToken()
    if (!$.bindInfo) {
        await wsgw.getBindInfo()
    } else {
        $.log('🔑 用户绑定信息: ' + $.toStr($.bindInfo))
    }
    // (全|默认)通知
    if (!NOTIFY_ALL) {
        $.bindInfo.powerUserList = $.bindInfo.powerUserList.filter((item) => item.isDefault === '1')
        if ($.bindInfo.powerUserList.length > 1) {
            $.bindInfo.powerUserList = $.bindInfo.powerUserList.filter((item) => item.elecTypeCode === '01')
        }
    }
    for (let i = 0; i < $.bindInfo.powerUserList.length; i++) {
        const [
            {
                date, // 截至日期
                totalPq, // 上月总用电量
                sumMoney, // 账户余额
                prepayBal, // 预存电费
                dayNum // 预计可用天数
            }
        ] = await wsgw.getElcFee(i)
        const {
            orgName, // 脱敏供电单位
            elecAddr_dst, // 脱敏具体地址
            consName_dst, // 脱敏主户名
            consNo_dst // 用电户号
        } = $.bindInfo.powerUserList[i]
        totalPq && $.subTitle.push(`本期电量: ${totalPq}度${sumMoney ? `  账户余额: ${sumMoney}元` : ''}`)
        date && $.message.push(`截至日期: ${date}`)
        prepayBal && $.message.push(`预存电费: ${prepayBal}元`)
        dayNum && $.message.push(`预计可用: ${dayNum}天`)
        consNo_dst && $.message.push(`户号信息: ${consNo_dst}${consName_dst ? `|${consName_dst}` : ''}`)
        orgName && $.message.push(`供电单位: ${orgName}`)
        elecAddr_dst && $.message.push(`用电地址: ${elecAddr_dst}`)
        // 是否展示近期用电
        if (SHOW_RECENT) {
            var { sevenEleList, totalPq: totalPQ } = await wsgw.getRecentElcFee(i)
            if (sevenEleList.length > 0 && totalPq > 0) {
                sevenEleList = sevenEleList.filter((item) => item?.thisVPq)
                if (sevenEleList.length > 6) sevenEleList = sevenEleList.slice(0, 6)
                $.message.push(`近期用电: ${totalPQ}度 ⚡️`)
                sevenEleList.map((item, index) => {
                    $.message.push(`${item.day}: ${item.dayElePq}度 ⚡️`)
                })
            }
        }
        await showNotification($.name, $.subTitle.join(''), $.message.join('\n').replace(/\n$/, ''))
        ;($.subTitle = []), ($.message = [])
    }
})()
    .catch((e) => $.log(`❌ ${$.name}, 失败! 原因: ${e}`))
    .finally(() => $.done())
// ------------------------------------------------------
// 免责声明
async function showNotice() {
    $.log('')
    $.log('1. 本脚本仅用于学习研究，禁止用于商业用途')
    $.log('2. 本脚本不保证准确性、可靠性、完整性和及时性')
    $.log('3. 任何个人或组织均可无需经过通知而自由使用')
    $.log('4. 作者对任何脚本问题概不负责，包括由此产生的任何损失')
    $.log('5. 如果任何单位或个人认为该脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明、所有权证明，我将在收到认证文件确认后删除')
    $.log('6. 请勿将本脚本用于商业用途，由此引起的问题与作者无关')
    $.log('7. 本脚本及其更新版权归作者所有')
    $.log('')
}
// 日志打印
function print(data, title) {
    if (!LOG_DEBUG) return
    data = typeof data === 'object' ? JSON.stringify(data) : data
    $.log('====================================')
    $.log(`${title}打印:`)
    $.log(data)
    $.log('====================================')
}
// prettier-ignore
function WSGW(){return new class{async getCode(){$.log("⏳ 获取keyCode和publicKey...");try{const e={url:"/api/oauth2/outer/c02/f02",method:"post",headers:{}};$.requestCyu=await fetchData(e),$.log("✔️ 获取keyCode和publicKey成功"),print($.requestCyu,"获取keyCode和publicKey")}catch(e){throw"获取KeyCode/PublicKey失败"}finally{$.log("🔚 获取keyCode和publicKey结束")}}async getVerifyCode(e){$.log("⏳ 获取验证码...");try{const t={url:"/api/osg-web0004/open/c44/f01",method:"post",data:{loginKey:e},headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey}},{code:o}=await fetchData(t);$.log("✔️ 获取验证码成功"),print(o,"验证码");const r=await this.recognizeCode(o);return $.log("✔️ 识别验证码成功"),print(r,"识别验证码"),r}catch(e){throw"获取验证码失败"}finally{$.log("🔚 获取验证码结束")}}async recognizeCode(e){$.log("⏳ 识别验证码...");try{const t=await $.http.post({url:MY_SERVER+"/api/recognize",headers:{"Content-Type":"application/json"},body:JSON.stringify({yuheng:e})}),{data:o}=JSON.parse(t.body);if(4!==o.length)throw"验证码识别失败, 请重试!";return o}catch(e){throw"识别验证码失败, 请重试!"}finally{$.log("🔚 识别验证码结束")}}async doLogin(e,t){$.log("⏳ 登录中...");try{const o={url:"/api/osg-web0004/open/c44/f02",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey},data:{loginKey:e,code:t,params:{uscInfo:{devciceIp:"",tenant:"state_grid",member:"0902",devciceId:""},quInfo:{optSys:"android",pushId:"000000",addressProvince:"110100",password:PASSWORD,addressRegion:"110101",account:USERNAME,addressCity:"330100"}},Channels:"web"}},{bizrt:r}=await fetchData(o);if(!(r?.userInfo?.length>0))throw"获取用户信息失败, 请检查!";$.setdata($.toStr(r),"95598_bizrt"),$.requestBizrt=r,$.log("✔️ 登录成功"),print($.requestBizrt,"登录")}catch(e){throw"登录失败"}finally{$.log("🔚 登录结束")}}async refreshToken(){const e=Math.random();$.log("🤘 生成的随机码: "+e);const t=await this.getVerifyCode(e);await this.doLogin(e,t)}async getAuthcode(){$.log("⏳ 获取授权码...");try{const e={url:"/api/oauth2/oauth/authorize",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey,token:$.requestBizrt.token}},{redirect_url:t}=await fetchData(e);$.authorizeCode=t.split("?code=")[1],$.log("✔️ 获取授权码成功"),print($.authorizeCode,"授权码")}catch(e){throw"获取授权码失败"}finally{$.log("🔚 获取授权码结束")}}async getAccessToken(){$.log("⏳ 获取凭证...");try{const e={url:"/api/oauth2/outer/getWebToken",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey,token:$.requestBizrt.token,authorizecode:$.authorizeCode}};$.requestToken=await fetchData(e),$.log("✔️ 获取凭证成功"),print($.requestToken,"凭证")}catch(e){throw"获取凭证失败"}finally{$.log("🔚 获取凭证结束")}}async refreshAccessToken(){await this.getAuthcode(),await this.getAccessToken()}async verifyBind(){$.log("⏳ 验证绑定...");try{const e={url:"/api/osg-open-uc0001/member/c8/f72",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey,token:$.requestBizrt.token,acctoken:$.requestToken.access_token},data:{uscInfo:{tenant:"state_grid",member:"0902",devciceId:"",devciceIp:""},quInfo:{token:$.requestBizrt.token,userId:$.requestBizrt.userInfo[0].userId,fileId:$.requestBizrt.userInfo[0].photo}}},t=await fetchData(e);$.log("✔️ 验证绑定成功"),print(t,"验证绑定")}catch(e){throw"验证绑定失败"}finally{$.log("🔚 验证绑定结束")}}async getBindInfo(){$.log("⏳ 查询绑定信息...");try{await this.verifyBind();const e={url:"/api/osg-open-uc0001/member/c9/f02",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey,token:$.requestBizrt.token,acctoken:$.requestToken.access_token},data:{serviceCode:"01010049",source:"0902",target:"-1",uscInfo:{member:"0902",devciceIp:"",devciceId:"",tenant:"state_grid"},quInfo:{userId:$.requestBizrt.userInfo[0].userId},token:$.requestBizrt.token,Channels:"web"}},{bizrt:t}=await fetchData(e);$.bindInfo=t,$.setdata($.toStr(t),"95598_bindInfo"),$.log("✔️ 查询绑定信息成功")}catch(e){throw e||"查询绑定信息失败"}finally{$.log("🔚 查询绑定信息结束")}}async getElcFee(e){$.log("⏳ 查询电费...");try{const t={url:"/api/osg-open-bc0001/member/c05/f01",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey,token:$.requestBizrt.token,acctoken:$.requestToken.access_token},data:{data:{srvCode:"",serialNo:"",channelCode:"0902",funcCode:"WEBA1007200",acctId:$.requestBizrt.userInfo[0].userId,userName:$.requestBizrt.userInfo[0].loginAccount,promotType:"1",promotCode:"1",userAccountId:$.requestBizrt.userInfo[0].userId,list:[{consNoSrc:$.bindInfo.powerUserList[e].consNo_dst,proCode:$.bindInfo.powerUserList[e].proNo,sceneType:$.bindInfo.powerUserList[e].constType,consNo:$.bindInfo.powerUserList[e].consNo,orgNo:$.bindInfo.powerUserList[e].orgNo}]},serviceCode:"0101143",source:"SGAPP",target:$.bindInfo.powerUserList[e].proNo}},{list:o}=await fetchData(t);return $.log("✔️ 查询电费成功"),print(o,"电费信息"),o}catch(e){throw"查询电费失败"}}async getRecentElcFee(e){$.log("⏳ 查询近期用电量...");try{const t=$.time("yyyy-MM-dd",(new Date).getTime()-864e5),o=$.time("yyyy-MM-dd",(new Date).getTime()-6048e5),r=$.time("yyyy",(new Date).getTime()),s={url:"/api/osg-web0004/member/c24/f01",method:"post",headers:{keyCode:$.requestCyu.keyCode,publicKey:$.requestCyu.publicKey,token:$.requestBizrt.token,acctoken:$.requestToken.access_token},data:{params1:{serviceCode:{order:"0101154",uploadPic:"0101296",pauseSCode:"0101250",pauseTCode:"0101251",listconsumers:"0101093",messageList:"0101343",submit:"0101003",sbcMsg:"0101210",powercut:"0104514",BkAuth01:"f15",BkAuth02:"f18",BkAuth03:"f02",BkAuth04:"f17",BkAuth05:"f05",BkAuth06:"f16",BkAuth07:"f01",BkAuth08:"f03"},source:"SGAPP",target:"32101",uscInfo:{member:"0902",devciceIp:"",devciceId:"",tenant:"state_grid"},quInfo:{userId:$.requestBizrt.userInfo[0].userId},token:$.requestBizrt.token},params3:{data:{acctId:$.requestBizrt.userInfo[0].userId,consNo:$.bindInfo.powerUserList[e].consNo_dst,consType:"01",endTime:t,orgNo:$.bindInfo.powerUserList[e].orgNo,queryYear:r,proCode:$.bindInfo.powerUserList[e].proNo,serialNo:"",srvCode:"",startTime:o,userName:$.requestBizrt.userInfo[0].loginAccount,funcCode:"WEBALIPAY_01",channelCode:"0902",clearCache:"11",promotCode:"1",promotType:"1"},serviceCode:"BCP_000026",source:"app",target:$.bindInfo.powerUserList[e].proNo},params4:"010103"}},n=await fetchData(s);return $.log("✔️ 查询近期用电量成功"),print(n,"近期用电量"),n}catch(e){throw"查询近期用电量失败"}}}}
// prettier-ignore
async function showNotification(n,o="",i="",t={}){const e="undefined"!=typeof $app&&"undefined"!=typeof $http,s=t["open-url"],f=t["media-url"];if($.isQuanX()&&$notify(n,o,i,t),$.isSurge()&&$notification.post(n,o,i,{url:s}),$.isLoon()){const t={},$=$loon.split(" ")[1].split(".")[0];s&&(t.openUrl=s),f&&16!==Number($)&&(t.mediaUrl=f),"{}"===JSON.stringify(t)?$notification.post(n,o,i):$notification.post(n,o,i,t)}const c=`${i}${s?`\n点击跳转: ${s}`:""}${f?`\n多媒体: ${f}`:""}`;if(e){require("push").schedule({title:n,body:`${o?`${o}\n`:""}${c}`})}if($.isNode())try{await notify.sendNotify(`${n}\n${o}`,c)}catch(n){console.log("没有找到sendNotify.js文件 不发送通知")}console.log(`${n}\n${o}\n${c}\n`)}
// prettier-ignore
function fetchData(t){const e=t.hasOwnProperty("method")?t.method.toLocaleLowerCase():"get";if($.isNode()&&t.hasOwnProperty("use_proxy")&&t.use_proxy){require("dotenv").config();const e=process.env.PROXY_HOST||"127.0.0.1",s=process.env.PROXY_PORT||7890,o=require("tunnel"),r={https:o.httpsOverHttp({proxy:{host:e,port:1*s}})};Object.assign(t,{agent:r})}return new Promise(async(s,o)=>{const r=await EncryptReq(t);switch(t.url){case"/api/oauth2/oauth/authorize":Object.assign(r,{body:r.body.replace(/^\"|\"$/g,"")})}$.http[e](r).then(async e=>{var o=e.body;try{o=JSON.parse(o)}catch(t){}const c={config:{...t},data:o};switch(t.url){case"/api/oauth2/outer/c02/f02":Object.assign(c.config,{headers:{encryptKey:r.encryptKey}})}const a=await DecrtyptResp(c);s(a)}).catch(t=>o(t))})}
// ------------------------------------------------------
// 考虑该应用的安全性, 加解密暂不公开
// prettier-ignore
function EncryptReq(e){return new Promise((t,a)=>{$.post({url:MY_SERVER+"/api/encrypt",headers:{"Content-Type":"application/json"},body:JSON.stringify({yuheng:e})},(e,n,r)=>{if(e)a(e);else{n=JSON.parse(r).data;n.url=BASE_URL+n.url,n.body=JSON.stringify(n.data),delete n.data,t(n)}})})}
// prettier-ignore
function DecrtyptResp(e){return new Promise((t,a)=>{$.post({url:MY_SERVER+"/api/decrypt",headers:{"Content-Type":"application/json"},body:JSON.stringify({yuheng:e})},(e,n,r)=>{if(e)a(e);else{n=JSON.parse(r).data;var{code:i,message:o,data:r}=n;"1"===i.toString()?t(r):(/无效|失效|过期|重新获取/.test(o)&&($.setdata("","95598_bizrt"),$.setdata("","95598_bindInfo"),console.log("✔️ 清理登录信息成功, 请重新运行脚本!")),a(o))}})})}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
