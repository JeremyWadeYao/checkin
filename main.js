// main.js - Railgun 自动签到脚本
// 支持企业微信通知，自动获取积分和剩余天数

const railgun = async () => {
  const cookie = process.env.RAILGUN_COOKIE
  if (!cookie) {
    console.log('❌ RAILGUN_COOKIE 未配置')
    return ['❌ 签到失败', '未配置 Cookie', '请在 GitHub Secrets 中添加 RAILGUN_COOKIE']
  }
  
  try {
    const headers = {
      'cookie': cookie,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'referer': 'https://railgun.info/console/checkin',
      'content-type': 'application/json'
    }
    
    console.log('📡 正在签到...')
    
    // 签到请求
    const checkin = await fetch('https://railgun.info/api/user/checkin', {
      method: 'POST',
      headers: headers,
    }).then((r) => r.json())
    
    console.log('签到响应:', checkin)
    
    // 获取用户状态
    const status = await fetch('https://railgun.info/api/user/status', {
      method: 'GET',
      headers: headers,
    }).then((r) => r.json())
    
    console.log('状态响应:', status)
    
    // 检查 Cookie 是否有效
    if (status.code !== 0) {
      return ['❌ 签到失败', 'Cookie 无效或已过期', '请重新获取 Cookie 并更新 Secrets']
    }
    
    const userData = status.data
    const leftDays = userData.leftDays || 0
    const email = userData.email || '未知'
    const traffic = userData.traffic || 0
    const vip = userData.vip || 0
    const port = userData.port || '未知'
    
    // 解析签到结果
    let resultMsg = ''
    let gainedPoints = 0
    
    if (checkin.code === 0) {
      gainedPoints = checkin.data?.point || checkin.data?.points || 0
      if (gainedPoints > 0) {
        resultMsg = `✅ 签到成功！获得 ${gainedPoints} 积分`
      } else {
        resultMsg = `✅ 签到成功（今日无积分奖励）`
      }
    } else if (checkin.code === -1) {
      resultMsg = `⚠️ 今日已签到`
    } else {
      resultMsg = `❌ 签到失败：${checkin.message || '未知错误'}`
    }
    
    // 获取当前时间（北京时间）
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    
    // 格式化流量（字节转GB）
    const trafficGB = (traffic / 1024 / 1024 / 1024).toFixed(2)
    
    // 构建返回结果
    const result = [
      '🚄 Railgun 签到通知',
      `👤 账号：${email}`,
      resultMsg,
      gainedPoints > 0 ? `🎁 获得积分：${gainedPoints}` : '',
      `💎 VIP等级：${vip}`,
      `📅 剩余天数：${leftDays} 天`,
      `📊 已用流量：${trafficGB} GB`,
      `🔌 端口：${port}`,
      `📅 时间：${now}`,
      `🔗 [点击查看详情](https://railgun.info/console/checkin)`
    ].filter(item => item !== '')  // 过滤空字符串
    
    return result
    
  } catch (error) {
    console.error('签到错误:', error)
    return [
      '❌ Railgun 签到异常',
      `错误：${error.message}`,
      '请检查网络连接或稍后重试'
    ]
  }
}

// 企业微信通知
const notify = async (contents) => {
  const webhook = process.env.WECOM_WEBHOOK
  if (!webhook) {
    console.log('⚠️ WECOM_WEBHOOK 未配置，跳过推送')
    console.log('💡 提示：如需接收通知，请在 GitHub Secrets 中添加 WECOM_WEBHOOK')
    return
  }
  
  if (!contents || contents.length === 0) {
    console.log('⚠️ 无通知内容，跳过推送')
    return
  }
  
  try {
    // 使用 markdown 格式，支持更好的排版
    const payload = {
      msgtype: "markdown",
      markdown: {
        content: contents.join('\n\n')
      }
    }
    
    console.log('📤 发送企业微信通知...')
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    const result = await response.json()
    if (result.errcode === 0) {
      console.log('✅ 企业微信通知发送成功')
    } else {
      console.log('❌ 企业微信通知发送失败:', result.errmsg)
    }
  } catch (error) {
    console.error('企业微信通知发送异常:', error)
  }
}

// 主函数
const main = async () => {
  console.log('🚀 Railgun 签到脚本启动')
  console.log(`⏰ 执行时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log('')
  
  const result = await railgun()
  
  console.log('\n📝 签到结果:')
  console.log('='.repeat(50))
  result.forEach(line => console.log(line))
  console.log('='.repeat(50))
  
  await notify(result)
  console.log('\n✅ 执行完成')
}

// 执行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
